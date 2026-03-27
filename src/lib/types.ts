/** Patient input features — all optional to support partial entry */
export interface PatientInput {
  // Optional patient identifiers (for PDF report only, not used in prediction)
  patient_name?: string;
  patient_mrn?: string;

  // Demographics
  age?: number;
  male?: number; // 0 or 1

  // Glycemic
  hba1c?: number;
  fasting_glucose?: number;

  // Lipid
  hdl?: number;
  ldl?: number;
  total_cholesterol?: number;
  triglyceride?: number;

  // Renal / Hepatic
  creatinine?: number;
  alt?: number;

  // Hematology
  hemoglobin?: number;

  // Blood Pressure
  systolic_bp?: number;
  diastolic_bp?: number;

  // Anthropometrics (display-only — NOT a model feature)
  bmi?: number;

  // Comorbidities
  dx_hypertension?: number;
  dx_dyslipidemia?: number;
  dx_obesity?: number;
  dx_hypothyroidism?: number;
  dx_comorbidity_count?: number;

  // Computed (auto-calculated from inputs)
  tg_hdl_ratio?: number;
  non_hdl_c?: number;

  // Historical (optional — triggers enhanced model)
  hist_hba1c_mean?: number;
  hist_hba1c_max?: number;
  hist_hba1c_variability?: number;
  hist_hba1c_ever_diabetic?: number;
  hist_hba1c_slope_per_year?: number;
  hist_fasting_glucose_mean?: number;
  hist_fasting_glucose_max?: number;
  hist_hdl_mean?: number;
  hist_hemoglobin_mean?: number;

  // Derived indices (auto-calculated)
  atherogenic_index?: number;
  tyg_index?: number;
  hgi?: number;
}

export type RiskTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface RiskBand {
  tier: RiskTier;
  label: string;
  color: string;
  bgColor: string;
  annualRate: string;
  action: string;
  nntLifestyle: string;
}

export interface ShapValue {
  feature: string;
  displayName: string;
  value: number;       // patient's value
  mean: number;        // population mean
  shap: number;        // SHAP contribution (coef * z)
  direction: 'risk' | 'protective';
}

export interface GroupContribution {
  group: string;
  totalShap: number;
  direction: 'risk' | 'protective';
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface PredictionResult {
  probability: number;          // calibrated 2-year conversion probability
  srs: number;                  // SauDRS Risk Score 0-100
  band: RiskBand;               // 6-tier classification
  confidenceInterval: [number, number]; // 95% CI on probability
  confidenceLevel: ConfidenceLevel;     // data completeness indicator
  shapValues: ShapValue[];      // sorted by |shap| (individual, suppressed features excluded)
  groupContributions: GroupContribution[]; // sorted by |totalShap|
  modelTier: 'enhanced' | 'core';
  linearPredictor: number;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export type DiabetesGateTier = 'definite_diabetes' | 'probable_a1c' | 'probable_fpg' | 'prediabetes' | 'below_prediabetes';

export interface DiabetesGateResult {
  tier: DiabetesGateTier;
  blocked: boolean;
  softBlocked: boolean;
  hemoglobinopathyFlag: boolean;
  title: string;
  message: string;
  recommendations: string[];
}
