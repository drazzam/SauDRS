/**
 * Clinical Input Validation
 *
 * THE most critical safety component of the system.
 * Every feature has hard bounds (reject) and soft bounds (warn).
 */

import type { PatientInput, ValidationError, DiabetesGateResult } from '@/lib/types';

interface FieldSpec {
  label: string;
  unit: string;
  hardMin: number;
  hardMax: number;
  softMin?: number;
  softMax?: number;
  required?: boolean;
}

const FIELD_SPECS: Record<string, FieldSpec> = {
  age:               { label: 'Age', unit: 'years', hardMin: 18, hardMax: 100, softMin: 25, softMax: 85, required: true },
  hba1c:             { label: 'HbA1c', unit: '%', hardMin: 3.0, hardMax: 20.0, softMin: 5.0, softMax: 9.0, required: true },
  fasting_glucose:   { label: 'Fasting Glucose', unit: 'mmol/L', hardMin: 1.0, hardMax: 35.0, softMin: 3.5, softMax: 15.0 },
  hdl:               { label: 'HDL', unit: 'mmol/L', hardMin: 0.1, hardMax: 5.0, softMin: 0.5, softMax: 3.0 },
  ldl:               { label: 'LDL', unit: 'mmol/L', hardMin: 0.1, hardMax: 10.0, softMin: 0.5, softMax: 6.0 },
  total_cholesterol: { label: 'Total Cholesterol', unit: 'mmol/L', hardMin: 1.0, hardMax: 15.0, softMin: 2.5, softMax: 10.0 },
  triglyceride:      { label: 'Triglycerides', unit: 'mmol/L', hardMin: 0.1, hardMax: 20.0, softMin: 0.3, softMax: 10.0 },
  creatinine:        { label: 'Creatinine', unit: '\u00b5mol/L', hardMin: 10, hardMax: 1500, softMin: 30, softMax: 400 },
  alt:               { label: 'ALT', unit: 'U/L', hardMin: 1, hardMax: 500, softMin: 5, softMax: 200 },
  hemoglobin:        { label: 'Hemoglobin', unit: 'g/dL', hardMin: 4.0, hardMax: 22.0, softMin: 8.0, softMax: 19.0 },
  systolic_bp:       { label: 'Systolic BP', unit: 'mmHg', hardMin: 60, hardMax: 250, softMin: 80, softMax: 200 },
  diastolic_bp:      { label: 'Diastolic BP', unit: 'mmHg', hardMin: 30, hardMax: 150, softMin: 40, softMax: 120 },
  bmi:               { label: 'BMI', unit: 'kg/m²', hardMin: 10, hardMax: 80, softMin: 15, softMax: 60 },
};

/**
 * Validate patient inputs. Returns array of errors/warnings.
 * An empty array means all inputs are valid.
 */
export function validateInputs(input: PatientInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required fields
  if (input.hba1c == null || isNaN(input.hba1c)) {
    errors.push({ field: 'hba1c', message: 'HbA1c is required for risk prediction', severity: 'error' });
  }
  if (input.age == null || isNaN(input.age)) {
    errors.push({ field: 'age', message: 'Age is required for risk prediction', severity: 'error' });
  }

  // Validate each field against specs
  for (const [field, spec] of Object.entries(FIELD_SPECS)) {
    const val = input[field as keyof PatientInput] as number | undefined;
    if (val == null || isNaN(val)) continue;

    if (val < spec.hardMin || val > spec.hardMax) {
      errors.push({
        field,
        message: `${spec.label} = ${val} ${spec.unit} is outside the physiologically possible range (${spec.hardMin}\u2013${spec.hardMax})`,
        severity: 'error',
      });
    } else if (spec.softMin != null && val < spec.softMin) {
      errors.push({
        field,
        message: `${spec.label} = ${val} ${spec.unit} is unusually low. Please verify.`,
        severity: 'warning',
      });
    } else if (spec.softMax != null && val > spec.softMax) {
      errors.push({
        field,
        message: `${spec.label} = ${val} ${spec.unit} is unusually high. Please verify.`,
        severity: 'warning',
      });
    }
  }

  // Cross-field: SBP must exceed DBP
  if (input.systolic_bp != null && input.diastolic_bp != null) {
    if (input.systolic_bp <= input.diastolic_bp) {
      errors.push({
        field: 'systolic_bp',
        message: 'Systolic BP must be greater than Diastolic BP',
        severity: 'error',
      });
    }
  }

  // Cross-field: HbA1c below prediabetes
  if (input.hba1c != null && input.hba1c < 5.7) {
    errors.push({
      field: 'hba1c',
      message: `HbA1c ${input.hba1c}% is below the prediabetes threshold (5.7%). This tool is designed for prediabetic patients.`,
      severity: 'warning',
    });
  }
  // NOTE: HbA1c >= 6.5% is now handled by the diabetes detection gate (checkDiabetesGate)
  // instead of a simple warning, per ADA 2025 diagnostic criteria.

  // Hemoglobinopathy advisory
  if (input.hemoglobin != null) {
    const threshold = (input.male === 1) ? 12.0 : 10.5;
    if (input.hemoglobin < threshold) {
      errors.push({
        field: 'hemoglobin',
        message: `Low hemoglobin (${input.hemoglobin} g/dL) may indicate hemoglobinopathy. HbA1c can be falsely low in sickle cell trait (prevalence 4\u20137% in Saudi Arabia). Interpret with caution.`,
        severity: 'warning',
      });
    }
  }

  return errors;
}

/** Check if there are any hard errors (not just warnings) */
export function hasHardErrors(errors: ValidationError[]): boolean {
  return errors.some(e => e.severity === 'error');
}

/**
 * Diabetes Detection Gate — per ADA 2025 Standards of Care, Section 2
 *
 * Checks if patient data suggests they already have diabetes (not prediabetes).
 * Must run BEFORE prediction. Returns a structured result indicating whether
 * prediction should be blocked, soft-blocked, or allowed.
 *
 * ADA 2025 diagnostic criteria for diabetes:
 *   - HbA1c >= 6.5% (48 mmol/mol), OR
 *   - FPG >= 7.0 mmol/L (126 mg/dL), OR
 *   - 2-h PG >= 11.1 mmol/L during OGTT (not available in this system), OR
 *   - Random PG >= 11.1 mmol/L with classic symptoms (not available)
 *
 * Two concordant abnormal tests from the same encounter confirm diabetes
 * without requiring a repeat test on a separate day.
 */
export function checkDiabetesGate(input: PatientInput): DiabetesGateResult | null {
  const hba1c = input.hba1c;
  const fg = input.fasting_glucose;
  const hgb = input.hemoglobin;
  const isMale = input.male === 1;

  if (hba1c == null) return null; // Cannot assess without HbA1c

  const hba1cDiabetic = hba1c >= 6.5;
  const fgDiabetic = fg != null && fg >= 7.0;
  const fgProvided = fg != null && !isNaN(fg);

  // Hemoglobinopathy flag
  const hemoFlag = hgb != null && hgb < (isMale ? 12.0 : 10.5);

  // TIER 0: DEFINITE DIABETES — both criteria met
  if (hba1cDiabetic && fgDiabetic) {
    return {
      tier: 'definite_diabetes',
      blocked: true,
      softBlocked: false,
      hemoglobinopathyFlag: hemoFlag,
      title: 'This patient likely already has diabetes',
      message: `Both HbA1c (${hba1c}%) and fasting glucose (${fg} mmol/L) exceed ADA diagnostic thresholds for diabetes (HbA1c \u2265 6.5%, FPG \u2265 7.0 mmol/L). When two different tests are both above diagnostic thresholds, diabetes is confirmed without requiring a repeat test on a separate day (ADA 2025 Standards of Care, Section 2, Recommendation 2.1). This tool predicts prediabetes-to-diabetes conversion risk and is not designed for patients who already meet diabetes diagnostic criteria.`,
      recommendations: [
        'Confirm diagnosis per institutional protocol',
        'Initiate diabetes management per ADA 2025 Standards of Care',
        'Refer to endocrinology if clinically appropriate',
      ],
    };
  }

  // TIER 1a: PROBABLE DIABETES — HbA1c diabetic only
  if (hba1cDiabetic && !fgDiabetic) {
    const borderlineNote = hba1c < 7.0
      ? ' Note: HbA1c values near the 6.5% threshold have a substantial probability of reclassifying below 6.5% on retest.'
      : '';
    const hemoNote = hemoFlag
      ? ` Caution: Low hemoglobin (${hgb} g/dL) raises the possibility of hemoglobinopathy. Some HbA1c assays may produce unreliable results in the presence of hemoglobin variants (sickle cell trait prevalence 4\u20137% in Saudi Arabia). Consider an assay validated for hemoglobinopathies or use fructosamine/glycated albumin.`
      : '';
    const fgNote = fgProvided
      ? ` Fasting glucose (${fg} mmol/L) is below the diabetes threshold.`
      : ' Fasting glucose was not provided for cross-validation.';

    return {
      tier: 'probable_a1c',
      blocked: false,
      softBlocked: true,
      hemoglobinopathyFlag: hemoFlag,
      title: 'Possible diabetes: HbA1c is in the diabetic range',
      message: `HbA1c ${hba1c}% meets the ADA diagnostic threshold for diabetes (\u2265 6.5%).${fgNote} The ADA requires a confirmatory test (repeat HbA1c or FPG \u2265 7.0 mmol/L on a separate day) before establishing a diabetes diagnosis (ADA 2025, Recommendation 2.1).${borderlineNote}${hemoNote}`,
      recommendations: [
        'Repeat HbA1c on a separate day, OR obtain fasting plasma glucose',
        'If confirmed \u2265 6.5% on repeat, diagnose and manage as diabetes',
        'Consider OGTT if results remain discordant',
      ],
    };
  }

  // TIER 1b: PROBABLE DIABETES — FPG diabetic only (HbA1c < 6.5%)
  if (!hba1cDiabetic && fgDiabetic) {
    const hemoNote = hemoFlag
      ? ` Caution: Low hemoglobin (${hgb} g/dL) suggests possible hemoglobinopathy. HbA1c may be falsely low, masking true glycemic status. The elevated fasting glucose may be the more reliable marker.`
      : '';

    return {
      tier: 'probable_fpg',
      blocked: false,
      softBlocked: true,
      hemoglobinopathyFlag: hemoFlag,
      title: 'Possible diabetes: Fasting glucose is in the diabetic range',
      message: `Fasting glucose ${fg} mmol/L (${Math.round(fg! * 18.0182)} mg/dL) meets the ADA diagnostic threshold for diabetes (\u2265 7.0 mmol/L / 126 mg/dL). HbA1c ${hba1c}% is below the diabetes threshold. Discordant results may indicate acute glycemic deterioration (FPG rises before HbA1c), conditions affecting HbA1c reliability (including hemoglobinopathies such as sickle cell trait, prevalence 4\u20137% in Saudi Arabia, which can cause falsely low HbA1c even with normal hemoglobin levels), or laboratory variability.${hemoNote} The ADA requires confirmatory retesting of the abnormal value (ADA 2025, Recommendation 2.1).`,
      recommendations: [
        'Repeat fasting plasma glucose on a separate day',
        'If confirmed \u2265 7.0 mmol/L on repeat, diagnose and manage as diabetes',
        'Consider OGTT for definitive assessment',
      ],
    };
  }

  // TIER 3: PREDIABETES — valid for prediction
  // (HbA1c 5.7-6.4% and FPG < 7.0 if provided)
  return null; // No gate triggered — proceed with prediction
}
