/**
 * SauDRS Prediction Engine — Pure JavaScript Arithmetic
 * Pipeline: raw input → auto-compute derived → standardize → dot product → sigmoid
 *
 * IMPORTANT: Binary features are NOT clipped at ±3 SD because sklearn's
 * StandardScaler (used during training) does not clip. Clipping binary
 * features attenuates rare conditions (e.g., obesity at 1.5% prevalence
 * loses 58% of its effect when clipped). Continuous features are still
 * clipped at ±3 SD as a safety measure against extrapolation.
 *
 * All features contribute to inference except dx_comorbidity_count
 * (zeroed due to irreparable train-deploy mismatch — see ZERO_AT_INFERENCE).
 * The validated test AUC of 0.806 was computed with ALL features active
 * and NO z-score clipping (matching sklearn behavior).
 *
 * DISPLAY: Only risk-increasing contributions (coef*z > 0) are shown
 * in both individual and group-level charts. Features in
 * SUPPRESS_INDIVIDUAL_DISPLAY are hidden from individual display even
 * when risk-increasing, to avoid multicollinearity artifacts.
 */

import type { PatientInput, PredictionResult, ShapValue, GroupContribution } from '@/lib/types';
import {
  ENHANCED_FEATURES, ENHANCED_COEFFICIENTS, ENHANCED_INTERCEPT,
  ENHANCED_SCALER_MEAN, ENHANCED_SCALER_SCALE,
  CORE_FEATURES, CORE_COEFFICIENTS, CORE_INTERCEPT,
  CORE_SCALER_MEAN, CORE_SCALER_SCALE,
} from './constants';
import { computeSRS, getRiskBand } from './scoring';
import { waldLogitCI } from './confidenceInterval';

const Z_CLIP = 3.0; // Clip z-scores to ±3 SD for CONTINUOUS features only

// Binary features: exempt from z-score clipping to match sklearn training behavior
const BINARY_FEATURES = new Set([
  'male', 'dx_hypertension', 'dx_dyslipidemia', 'dx_obesity',
  'dx_hypothyroidism', 'hist_hba1c_ever_diabetic',
]);

// Features to suppress from INDIVIDUAL display (misleading in isolation due to
// multicollinearity or suppressor effects). These are excluded from both
// individual AND group-level display when their contribution is negative.
// The suppression matters when their contribution is positive (below-mean z
// with negative coefficient), which would otherwise appear as a risk factor.
const SUPPRESS_INDIVIDUAL_DISPLAY = new Set([
  'hist_hba1c_max',           // suppressor pair with hist_hba1c_mean
  'hist_fasting_glucose_mean', // suppressor pair with hist_fasting_glucose_max
  'ldl',                       // multicollinearity with TC/non-HDL-C
  'tg_hdl_ratio',             // collinear with triglyceride/hdl
  'tyg_index',                // collinear with triglyceride/fasting_glucose
  'dx_comorbidity_count',     // train-deploy mismatch (15-flag vs 4-flag)
]);

// Features to zero out during inference due to irreparable train-deploy mismatch.
// dx_comorbidity_count was trained on a 15-diagnosis sum but the app can only
// compute a 4-diagnosis sum. Vignette testing showed the 4-flag version causes
// MORE distortion than zeroing: a patient with 3 comorbidities gets -1.59 logit
// (massive protective effect), making multimorbid patients appear LOWER risk.
// Zeroing is the lesser of two evils until the model is retrained.
const ZERO_AT_INFERENCE = new Set(['dx_comorbidity_count']);

// Clinical domain grouping for feature contributions
const FEATURE_GROUPS: Record<string, { label: string; features: string[] }> = {
  glycemic: {
    label: 'Glycemic Control',
    features: ['hba1c', 'fasting_glucose', 'hgi'],
  },
  glycemic_history: {
    label: 'Glycemic Trajectory',
    features: [
      'hist_hba1c_mean', 'hist_hba1c_max', 'hist_hba1c_variability',
      'hist_hba1c_ever_diabetic', 'hist_hba1c_slope_per_year',
      'hist_fasting_glucose_mean', 'hist_fasting_glucose_max',
    ],
  },
  lipid: {
    label: 'Lipid Profile',
    features: [
      'hdl', 'ldl', 'total_cholesterol', 'triglyceride',
      'non_hdl_c', 'tg_hdl_ratio', 'atherogenic_index', 'tyg_index', 'hist_hdl_mean',
    ],
  },
  blood_pressure: {
    label: 'Blood Pressure',
    features: ['systolic_bp', 'diastolic_bp'],
  },
  demographics: {
    label: 'Age & Sex',
    features: ['age', 'male'],
  },
  comorbidities: {
    label: 'Comorbidities',
    features: ['dx_hypertension', 'dx_dyslipidemia', 'dx_obesity', 'dx_comorbidity_count'],
  },
  renal_hepatic: {
    label: 'Renal & Hepatic',
    features: ['creatinine', 'alt', 'hemoglobin', 'hist_hemoglobin_mean'],
  },
  other_clinical: {
    label: 'Other Clinical Factors',
    features: ['dx_hypothyroidism'],
  },
};

function hasHistoricalData(input: PatientInput): boolean {
  return input.hist_hba1c_mean != null && !isNaN(input.hist_hba1c_mean);
}

/** Auto-compute ALL derived features from raw clinical inputs */
function computeDerived(input: PatientInput): PatientInput {
  const out = { ...input };

  // Auto-compute comorbidity count from binary flags
  out.dx_comorbidity_count =
    (out.dx_hypertension === 1 ? 1 : 0) +
    (out.dx_dyslipidemia === 1 ? 1 : 0) +
    (out.dx_obesity === 1 ? 1 : 0) +
    (out.dx_hypothyroidism === 1 ? 1 : 0);

  if (out.triglyceride != null && out.hdl != null && out.hdl > 0) {
    out.tg_hdl_ratio = out.triglyceride / out.hdl;
  }
  if (out.total_cholesterol != null && out.hdl != null) {
    out.non_hdl_c = out.total_cholesterol - out.hdl;
  }
  if (out.triglyceride != null && out.hdl != null && out.hdl > 0 && out.triglyceride > 0) {
    out.atherogenic_index = Math.log10(out.triglyceride / out.hdl);
  }
  if (out.triglyceride != null && out.fasting_glucose != null && out.triglyceride > 0 && out.fasting_glucose > 0) {
    out.tyg_index = Math.log(out.triglyceride * out.fasting_glucose / 2);
  }
  if (out.hba1c != null && out.fasting_glucose != null) {
    const fg_mgdl = out.fasting_glucose * 18.0182;
    out.hgi = out.hba1c - (0.008 * fg_mgdl + 4.8);
  }

  // Auto-compute historical variability from mean and max (if user provided both)
  if (out.hist_hba1c_mean != null && out.hist_hba1c_max != null && out.hist_hba1c_variability == null) {
    out.hist_hba1c_variability = Math.max(0, (out.hist_hba1c_max - out.hist_hba1c_mean) * 0.6);
  }

  // Auto-compute HbA1c slope if current and historical mean available
  if (out.hba1c != null && out.hist_hba1c_mean != null && out.hist_hba1c_slope_per_year == null) {
    out.hist_hba1c_slope_per_year = (out.hba1c - out.hist_hba1c_mean) / 2.0; // assume ~2 year gap
  }

  // hist_hba1c_ever_diabetic from max
  if (out.hist_hba1c_max != null && out.hist_hba1c_ever_diabetic == null) {
    out.hist_hba1c_ever_diabetic = out.hist_hba1c_max >= 6.5 ? 1 : 0;
  }

  return out;
}

function sigmoid(x: number): number {
  if (x >= 0) return 1 / (1 + Math.exp(-x));
  const ex = Math.exp(x);
  return ex / (1 + ex);
}

export function predict(rawInput: PatientInput): PredictionResult {
  const input = computeDerived(rawInput);
  const useEnhanced = hasHistoricalData(input);

  const features = useEnhanced ? ENHANCED_FEATURES : CORE_FEATURES;
  const coefficients = useEnhanced ? ENHANCED_COEFFICIENTS : CORE_COEFFICIENTS;
  const intercept = useEnhanced ? ENHANCED_INTERCEPT : CORE_INTERCEPT;
  const scalerMean = useEnhanced ? ENHANCED_SCALER_MEAN : CORE_SCALER_MEAN;
  const scalerScale = useEnhanced ? ENHANCED_SCALER_SCALE : CORE_SCALER_SCALE;

  let lp = intercept;
  const shapValues: ShapValue[] = [];
  const allContributions: Record<string, { shap: number; value: number; mean: number }> = {};
  const zScores: number[] = [];

  // Count user-provided features from RAW input (before computeDerived),
  // NOT from the derived input. Auto-computed features (tg_hdl_ratio,
  // non_hdl_c, dx_comorbidity_count, etc.) should not inflate completeness.
  let nProvided = 0;
  for (let i = 0; i < features.length; i++) {
    const feat = features[i];
    const rv = rawInput[feat as keyof PatientInput] as number | undefined;
    if (rv != null && !isNaN(rv)) nProvided++;
  }

  for (let i = 0; i < features.length; i++) {
    const feat = features[i];
    const rawVal = input[feat as keyof PatientInput] as number | undefined;
    const val = rawVal ?? scalerMean[i];

    // Standardize: z = (value - mean) / scale
    let z = (val - scalerMean[i]) / scalerScale[i];

    // Clip only CONTINUOUS features at ±3 SD.
    // Binary features are NOT clipped — matches sklearn training behavior.
    if (!BINARY_FEATURES.has(feat)) {
      z = Math.max(-Z_CLIP, Math.min(Z_CLIP, z));
    }

    zScores.push(z);
    const coef = coefficients[feat] ?? 0;

    // Zero features with irreparable train-deploy mismatch
    const contribution = ZERO_AT_INFERENCE.has(feat) ? 0 : coef * z;
    lp += contribution;

    allContributions[feat] = { shap: contribution, value: val, mean: scalerMean[i] };

    // Individual display: only RISK-INCREASING features (contribution > 0),
    // excluding suppressed features. Protective factors are not shown to avoid
    // confusing clinicians with multicollinearity artifacts (e.g., LDL appearing
    // protective, diastolic BP appearing protective).
    if (!SUPPRESS_INDIVIDUAL_DISPLAY.has(feat) && contribution > 0.001) {
      shapValues.push({
        feature: feat,
        displayName: FEATURE_DISPLAY[feat] ?? feat,
        value: val,
        mean: scalerMean[i],
        shap: contribution,
        direction: 'risk',
      });
    }
  }

  shapValues.sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap));

  // Compute group-level contributions — only sum RISK-INCREASING individual
  // contributions (positive coef*z) to avoid suppressor artifacts.
  // Features with counterintuitive negative coefficients (LDL, hist_hba1c_max,
  // hist_fasting_glucose_mean, diastolic_bp, hypothyroidism) would otherwise
  // make their group appear protective, contradicting the individual risk factors.
  const groupContributions: GroupContribution[] = [];
  for (const [, group] of Object.entries(FEATURE_GROUPS)) {
    let totalRisk = 0;
    let hasAny = false;
    for (const feat of group.features) {
      if (allContributions[feat] && allContributions[feat].shap > 0) {
        totalRisk += allContributions[feat].shap;
        hasAny = true;
      }
    }
    if (hasAny && totalRisk > 0.001) {
      groupContributions.push({
        group: group.label,
        totalShap: totalRisk,
        direction: 'risk',
      });
    }
  }
  groupContributions.sort((a, b) => b.totalShap - a.totalShap);

  // Count extreme z-scores (|z| > 2.5) among user-provided continuous features.
  // Outlier values mean the model is extrapolating beyond training distribution,
  // reducing estimate reliability regardless of data completeness.
  let nExtremeZ = 0;
  for (let i = 0; i < features.length; i++) {
    const feat = features[i];
    if (BINARY_FEATURES.has(feat)) continue; // binary features can have large z, that's expected
    const rv = rawInput[feat as keyof PatientInput] as number | undefined;
    if (rv != null && !isNaN(rv) && Math.abs(zScores[i]) > 2.5) nExtremeZ++;
  }

  const probability = sigmoid(lp);
  const srs = computeSRS(probability);
  const band = getRiskBand(srs);
  const ci = waldLogitCI(probability, nProvided, features.length);

  // Downgrade confidence if patient has extreme outlier values
  let finalConfidence = ci.confidence;
  if (nExtremeZ >= 3) finalConfidence = 'low';
  else if (nExtremeZ >= 1 && finalConfidence === 'high') finalConfidence = 'medium';

  return {
    probability, srs, band,
    confidenceInterval: ci.interval,
    confidenceLevel: finalConfidence,
    shapValues,
    groupContributions,
    modelTier: useEnhanced ? 'enhanced' : 'core',
    linearPredictor: lp,
  };
}

const FEATURE_DISPLAY: Record<string, string> = {
  hba1c: 'HbA1c',
  age: 'Age',
  male: 'Sex (Male)',
  fasting_glucose: 'Fasting Glucose',
  hdl: 'HDL Cholesterol',
  ldl: 'LDL Cholesterol',
  total_cholesterol: 'Total Cholesterol',
  triglyceride: 'Triglycerides',
  creatinine: 'Serum Creatinine',
  alt: 'ALT',
  hemoglobin: 'Hemoglobin',
  systolic_bp: 'Systolic BP',
  diastolic_bp: 'Diastolic BP',
  dx_hypertension: 'Hypertension',
  dx_dyslipidemia: 'Dyslipidemia',
  dx_obesity: 'Obesity',
  dx_hypothyroidism: 'Hypothyroidism',
  dx_comorbidity_count: 'Comorbidity Count',
  tg_hdl_ratio: 'TG/HDL Ratio',
  non_hdl_c: 'Non-HDL Cholesterol',
  hist_hba1c_mean: 'Hist. Mean HbA1c',
  hist_hba1c_max: 'Hist. Peak HbA1c',
  hist_hba1c_variability: 'HbA1c Variability',
  hist_hba1c_ever_diabetic: 'Prior Diabetic HbA1c',
  hist_hba1c_slope_per_year: 'HbA1c Trend',
  hist_fasting_glucose_mean: 'Hist. Mean Glucose',
  hist_fasting_glucose_max: 'Hist. Peak Glucose',
  hist_hdl_mean: 'Hist. Mean HDL',
  hist_hemoglobin_mean: 'Hist. Mean Hemoglobin',
  atherogenic_index: 'Atherogenic Index',
  tyg_index: 'TyG Index',
  hgi: 'Glycation Index',
};
