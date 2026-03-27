'use client';

import { useState, useCallback, useTransition } from 'react';
import type { PatientInput, PredictionResult, ValidationError, DiabetesGateResult } from '@/lib/types';
import { predict, validateInputs, hasHardErrors, checkDiabetesGate } from '@/lib/model';
import { RiskGauge } from '@/components/RiskGauge';
import { ShapChart } from '@/components/ShapChart';
import { BANDS } from '@/lib/model/scoring';
import { PDFDownloadButton } from '@/components/PDFDownloadButton';

// ── Field definitions ────────────────────────────────────

interface FieldDef {
  key: keyof PatientInput;
  label: string;
  unit: string;
  info: string;  // shown on ? click
  step?: string;
  type?: 'number' | 'select';
  options?: { value: number; label: string }[];
}

const DEMOGRAPHICS: FieldDef[] = [
  { key: 'age', label: 'Age', unit: 'years', info: 'Patient age in completed years. Normal adult range: 18\u2013100.' },
  { key: 'male', label: 'Sex', unit: '', info: 'Biological sex. Males have slightly higher diabetes conversion rates.', type: 'select',
    options: [{ value: 1, label: 'Male' }, { value: 0, label: 'Female' }] },
];

const GLYCEMIC: FieldDef[] = [
  { key: 'hba1c', label: 'HbA1c', unit: '%', info: 'Glycated hemoglobin reflecting 2\u20133 month average glucose. Prediabetes range: 5.7\u20136.4%. Diabetic: \u22656.5%. May be unreliable in hemoglobinopathies.', step: '0.1' },
  { key: 'fasting_glucose', label: 'Fasting Glucose', unit: 'mmol/L', info: 'Venous plasma glucose after \u22658 hours fasting. Normal: 3.9\u20135.5 mmol/L. Impaired fasting glucose: 5.6\u20136.9 mmol/L. Diabetic: \u22657.0 mmol/L.', step: '0.1' },
];

const LIPID: FieldDef[] = [
  { key: 'hdl', label: 'HDL Cholesterol', unit: 'mmol/L', info: 'High-density lipoprotein. Desirable: >1.0 mmol/L (M), >1.3 mmol/L (F). Higher is protective.', step: '0.01' },
  { key: 'ldl', label: 'LDL Cholesterol', unit: 'mmol/L', info: 'Low-density lipoprotein. Optimal: <2.6 mmol/L. Borderline high: 3.4\u20134.1 mmol/L.', step: '0.01' },
  { key: 'total_cholesterol', label: 'Total Cholesterol', unit: 'mmol/L', info: 'Total serum cholesterol. Desirable: <5.2 mmol/L. Borderline: 5.2\u20136.2 mmol/L.', step: '0.01' },
  { key: 'triglyceride', label: 'Triglycerides', unit: 'mmol/L', info: 'Serum triglycerides (fasting preferred). Normal: <1.7 mmol/L. Borderline: 1.7\u20132.2 mmol/L. High: \u22652.3 mmol/L.', step: '0.01' },
];

const RENAL_HEPATIC: FieldDef[] = [
  { key: 'creatinine', label: 'Creatinine', unit: '\u00b5mol/L', info: 'Serum creatinine. Normal: 62\u2013106 \u00b5mol/L (M), 44\u201380 \u00b5mol/L (F). Elevated values may indicate renal impairment.' },
  { key: 'alt', label: 'ALT', unit: 'U/L', info: 'Alanine aminotransferase. Normal: <40 U/L. Elevated ALT is associated with fatty liver and insulin resistance.' },
  { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', info: 'Blood hemoglobin. Normal: 13.5\u201317.5 g/dL (M), 12.0\u201315.5 g/dL (F). Low hemoglobin may affect HbA1c reliability. Sickle cell trait prevalence in Saudi Arabia: 4\u20137%.', step: '0.1' },
];

const BLOOD_PRESSURE: FieldDef[] = [
  { key: 'systolic_bp', label: 'Systolic BP', unit: 'mmHg', info: 'Office systolic blood pressure. Normal: <120 mmHg. Elevated: 120\u2013129 mmHg. Hypertension Stage 1: 130\u2013139 mmHg.' },
  { key: 'diastolic_bp', label: 'Diastolic BP', unit: 'mmHg', info: 'Office diastolic blood pressure. Normal: <80 mmHg. Hypertension Stage 1: 80\u201389 mmHg.' },
];

const COMORBIDITIES: FieldDef[] = [
  { key: 'dx_hypertension', label: 'Hypertension', unit: '', info: 'Documented hypertension diagnosis. Associated with increased diabetes risk and cardiovascular complications.', type: 'select',
    options: [{ value: 0, label: 'No' }, { value: 1, label: 'Yes' }] },
  { key: 'dx_dyslipidemia', label: 'Dyslipidemia', unit: '', info: 'Documented dyslipidemia (abnormal lipid levels). Common in prediabetic patients.', type: 'select',
    options: [{ value: 0, label: 'No' }, { value: 1, label: 'Yes' }] },
  { key: 'bmi', label: 'BMI', unit: 'kg/m\u00b2', info: 'Body Mass Index. If provided, obesity status is auto-set (BMI \u226530 = Yes). WHO classes: 25\u201329.9 Overweight, 30\u201334.9 Class I Obesity, 35\u201339.9 Class II, \u226540 Class III. ADA Rec. 3.7: strongest metformin evidence at BMI \u226535.', step: '0.1' },
  { key: 'dx_obesity', label: 'Obesity', unit: '', info: 'Documented obesity diagnosis (BMI \u226530 kg/m\u00b2). Auto-set when BMI is provided. Strong risk factor for diabetes conversion. Saudi prediabetes population mean BMI: 33.8 kg/m\u00b2.', type: 'select',
    options: [{ value: 0, label: 'No' }, { value: 1, label: 'Yes' }] },
  { key: 'dx_hypothyroidism', label: 'Hypothyroidism', unit: '', info: 'Documented hypothyroidism. Can affect metabolic profile and glucose metabolism.', type: 'select',
    options: [{ value: 0, label: 'No' }, { value: 1, label: 'Yes' }] },
];

// ── BMI classification helper ────────────────────────────

function getBmiClass(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' };
  if (bmi < 25) return { label: 'Normal weight', color: 'text-green-600' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-amber-600' };
  if (bmi < 35) return { label: 'Class I Obesity', color: 'text-orange-600' };
  if (bmi < 40) return { label: 'Class II Obesity', color: 'text-red-600' };
  return { label: 'Class III Obesity', color: 'text-red-800' };
}

const HISTORICAL: FieldDef[] = [
  { key: 'hist_hba1c_mean', label: 'Average of Prior HbA1c Values', unit: '%', info: 'The average (mean) of all previously recorded HbA1c measurements from prior clinic visits. If the patient had three prior readings of 5.8%, 5.9%, and 6.0%, enter 5.9%.', step: '0.1' },
  { key: 'hist_hba1c_max', label: 'Highest Prior HbA1c', unit: '%', info: 'The single highest HbA1c ever recorded for this patient in prior laboratory results. This captures the peak glycemic burden.', step: '0.1' },
  { key: 'hist_hba1c_ever_diabetic', label: 'Any Prior HbA1c \u22656.5%?', unit: '', info: 'Has the patient ever had a single HbA1c measurement in the diabetic range (\u22656.5%) in their prior records? Even a single episode of diabetic-range HbA1c significantly increases future risk.', type: 'select',
    options: [{ value: 0, label: 'No' }, { value: 1, label: 'Yes' }] },
  { key: 'hist_fasting_glucose_mean', label: 'Average of Prior Fasting Glucose', unit: 'mmol/L', info: 'The average of all previously recorded fasting glucose values from prior visits.', step: '0.1' },
  { key: 'hist_fasting_glucose_max', label: 'Highest Prior Fasting Glucose', unit: 'mmol/L', info: 'The single highest fasting glucose ever recorded in prior laboratory results.', step: '0.1' },
  { key: 'hist_hdl_mean', label: 'Average of Prior HDL', unit: 'mmol/L', info: 'The average of all previously recorded HDL cholesterol values.', step: '0.01' },
  { key: 'hist_hemoglobin_mean', label: 'Average of Prior Hemoglobin', unit: 'g/dL', info: 'The average of all previously recorded hemoglobin values. Relevant for assessing HbA1c reliability over time.', step: '0.1' },
];

const FORM_SECTIONS = [
  { title: 'Demographics', fields: DEMOGRAPHICS },
  { title: 'Glycemic Markers', fields: GLYCEMIC },
  { title: 'Lipid Panel', fields: LIPID },
  { title: 'Renal / Hepatic / Hematology', fields: RENAL_HEPATIC },
  { title: 'Blood Pressure', fields: BLOOD_PRESSURE },
  { title: 'Comorbidities', fields: COMORBIDITIES },
];

// ── Risk-stratified sample data generators ───────────────
// Each generator produces clinically plausible patients that
// ALWAYS fall into the target risk tier, even in the worst-case
// combination of random values. Ranges were calibrated by tracing
// the model's scoring pipeline at every extreme.
//
// Worst-case SRS by generator (verified):
//   Low:      SRS 40  (Tier 2)  — target: Tier 1-2 (SRS <= 40)
//   Moderate: SRS 55  (Tier 3)  — target: Tier 3   (SRS <= 56)
//   High:     SRS 81  (Tier 5)  — target: Tier 4-5 (SRS <= 83)

type RiskProfile = 'low' | 'moderate' | 'high' | 'random';

function generatePatientByRisk(profile: RiskProfile): PatientInput {
  if (profile === 'random') {
    // Random across all risk levels
    const profiles: RiskProfile[] = ['low', 'moderate', 'high'];
    return generatePatientByRisk(profiles[Math.floor(Math.random() * profiles.length)]);
  }

  if (profile === 'low') {
    // Low risk: young, low HbA1c, good lipids, no comorbidities
    // Worst-case SRS = 40 (Tier 2). Best-case SRS ~ 15 (Tier 1).
    const male = Math.random() > 0.5 ? 1 : 0;
    const age = Math.floor(28 + Math.random() * 14); // 28-42
    const hba1c = +(5.7 + Math.random() * 0.1).toFixed(1); // 5.7-5.8
    const fg = +(4.5 + Math.random() * 0.6).toFixed(1); // 4.5-5.1
    const hdl = +(1.3 + Math.random() * 0.5).toFixed(2); // 1.3-1.8 (high = good)
    const tg = +(0.5 + Math.random() * 0.5).toFixed(2); // 0.5-1.0 (low = good)
    const ldl = +(1.8 + Math.random() * 1.0).toFixed(2); // 1.8-2.8
    const tc = +(hdl + ldl + tg / 2.2 + Math.random() * 0.2).toFixed(2);
    const cr = Math.floor(male === 1 ? 62 + Math.random() * 20 : 44 + Math.random() * 30); // M:62-82, F:44-74
    const altv = Math.floor(12 + Math.random() * 18); // 12-30
    const hgb = +(male === 1 ? 14.0 + Math.random() * 2 : 12.2 + Math.random() * 1.5).toFixed(1);
    const sbp = Math.floor(105 + Math.random() * 15); // 105-120
    const dbp = Math.floor(68 + Math.random() * 10); // 68-78
    const bmi = +(20 + Math.random() * 4.9).toFixed(1); // 20.0-24.9 (normal weight)
    return {
      age, male, hba1c, fasting_glucose: fg,
      hdl, ldl, total_cholesterol: tc, triglyceride: tg,
      creatinine: cr, alt: altv, hemoglobin: hgb,
      systolic_bp: sbp, diastolic_bp: Math.min(dbp, sbp - 10),
      dx_hypertension: 0, dx_dyslipidemia: 0, dx_obesity: 0, dx_hypothyroidism: 0,
      bmi,
    };
  }

  if (profile === 'moderate') {
    // Moderate risk: middle-aged, moderate HbA1c, mixed lipids
    // Worst-case SRS = 55 (Tier 3). Best-case SRS ~ 35 (Tier 2).
    // When hypertension is present (15%), other values are compensated
    // downward to prevent the combined effect from exceeding Tier 3.
    const male = Math.random() > 0.5 ? 1 : 0;
    const htn = Math.random() > 0.85 ? 1 : 0; // 15% chance
    // Compensate when hypertension is present (adds +0.24 logit)
    const age = Math.floor(45 + Math.random() * (htn ? 5 : 10)); // 45-50 (HTN) or 45-55
    const hba1c = +(5.9 + Math.random() * (htn ? 0 : 0.1)).toFixed(1); // 5.9 (HTN) or 5.9-6.0
    const fg = +(5.2 + Math.random() * (htn ? 0.2 : 0.4)).toFixed(1); // 5.2-5.4 (HTN) or 5.2-5.6
    const hdl = +(1.05 + Math.random() * 0.35).toFixed(2); // 1.05-1.4
    const tg = +(1.0 + Math.random() * (htn ? 0.3 : 0.5)).toFixed(2); // 1.0-1.3 (HTN) or 1.0-1.5
    const ldl = +(2.2 + Math.random() * 0.8).toFixed(2); // 2.2-3.0
    const tc = +(hdl + ldl + tg / 2.2 + Math.random() * 0.2).toFixed(2);
    const cr = Math.floor(male === 1 ? 65 + Math.random() * 20 : 50 + Math.random() * 25); // M:65-85, F:50-75
    const altv = Math.floor(12 + Math.random() * 28); // 12-40
    const hgb = +(male === 1 ? 13.5 + Math.random() * 2.5 : 12.0 + Math.random() * 2).toFixed(1);
    const sbp = Math.floor(120 + Math.random() * 15); // 120-135
    const dbp = Math.floor(72 + Math.random() * 10); // 72-82
    const bmi = +(26 + Math.random() * 3.9).toFixed(1); // 26.0-29.9 (overweight, below obesity)
    return {
      age, male, hba1c, fasting_glucose: fg,
      hdl, ldl, total_cholesterol: tc, triglyceride: tg,
      creatinine: cr, alt: altv, hemoglobin: hgb,
      systolic_bp: sbp, diastolic_bp: Math.min(dbp, sbp - 10),
      dx_hypertension: htn, dx_dyslipidemia: 0,
      dx_obesity: 0, dx_hypothyroidism: 0,
      bmi,
    };
  }

  // High risk: older, high HbA1c, poor lipids, comorbidities
  // Worst-case SRS = 81 (Tier 5). Best-case SRS ~ 63 (Tier 4).
  // When obesity is present (15%), multiple values are compensated
  // downward to absorb the +0.62 logit from obesity (z=7.09 unclipped).
  // HbA1c < 6.5 and FPG < 7.0 to avoid triggering diabetes gate.
  const male = Math.random() > 0.4 ? 1 : 0;
  const hasObesity = Math.random() > 0.85; // 15% chance
  // Compensate when obesity is present (adds +0.62 logit via z=7.09):
  // lower age, fix HbA1c, narrow FG/TG, raise HDL floor, lower SBP/creatinine
  const age = Math.floor(55 + Math.random() * (hasObesity ? 3 : 10)); // 55-58 (obese) or 55-65
  const hba1c = +(hasObesity ? 6.2 : 6.2 + Math.random() * 0.2).toFixed(1); // 6.2 (obese) or 6.2-6.4
  const fg = +(5.8 + Math.random() * (hasObesity ? 0.1 : 0.4)).toFixed(1); // 5.8-5.9 (obese) or 5.8-6.2
  const hdl = +((hasObesity ? 0.95 : 0.9) + Math.random() * 0.15).toFixed(2); // 0.95-1.1 (obese) or 0.9-1.05
  const tg = +(1.5 + Math.random() * (hasObesity ? 0.1 : 0.3)).toFixed(2); // 1.5-1.6 (obese) or 1.5-1.8
  const ldl = +(2.5 + Math.random() * 0.7).toFixed(2); // 2.5-3.2
  const tc = +(hdl + ldl + tg / 2.2 + Math.random() * 0.2).toFixed(2);
  const cr = Math.floor(male === 1 ? 70 + Math.random() * (hasObesity ? 15 : 25) : 55 + Math.random() * 20); // M:70-95, F:55-75
  const altv = Math.floor(18 + Math.random() * 32); // 18-50
  const hgb = +(male === 1 ? 13.5 + Math.random() * 2 : 12.0 + Math.random() * 1.5).toFixed(1);
  const sbp = Math.floor(130 + Math.random() * (hasObesity ? 8 : 12)); // 130-138 (obese) or 130-142
  const dbp = Math.floor((hasObesity ? 72 : 70) + Math.random() * (hasObesity ? 6 : 8)); // 72-78 (obese) or 70-78
  const bmi = +(hasObesity ? 32 + Math.random() * 6 : 27 + Math.random() * 2.9).toFixed(1); // 32-38 (obese) or 27-29.9
  return {
    age, male, hba1c, fasting_glucose: fg,
    hdl, ldl, total_cholesterol: tc, triglyceride: tg,
    creatinine: cr, alt: altv, hemoglobin: hgb,
    systolic_bp: sbp, diastolic_bp: Math.min(dbp, sbp - 10),
    dx_hypertension: Math.random() > 0.3 ? 1 : 0, dx_dyslipidemia: Math.random() > 0.5 ? 1 : 0,
    dx_obesity: hasObesity ? 1 : 0, dx_hypothyroidism: 0,
    bmi,
  };
}

// ── Info tooltip component ───────────────────────────────

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold leading-none hover:bg-gray-300 inline-flex items-center justify-center flex-shrink-0"
      >?</button>
      {open && (
        <div className="absolute z-50 bottom-7 left-0 sm:left-0 w-[min(16rem,calc(100vw-3rem))] p-3 rounded-lg shadow-lg border border-gray-200 bg-white text-xs text-gray-700">
          {text}
          <button onClick={() => setOpen(false)} className="block mt-2 text-blue-600 text-[10px] min-h-[28px]">Close</button>
        </div>
      )}
    </span>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function PredictPage() {
  const [input, setInput] = useState<PatientInput>({});
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [diabetesGate, setDiabetesGate] = useState<DiabetesGateResult | null>(null);
  const [diabetesAcknowledged, setDiabetesAcknowledged] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateField = useCallback((key: keyof PatientInput, value: string) => {
    setInput(prev => {
      const next = { ...prev, [key]: value === '' ? undefined : Number(value) };
      // Auto-set dx_obesity when BMI is entered
      if (key === 'bmi') {
        if (value === '') {
          // BMI cleared — don't reset dx_obesity (let clinician keep manual choice)
        } else {
          next.dx_obesity = Number(value) >= 30 ? 1 : 0;
        }
      }
      return next;
    });
  }, []);

  const handlePredict = useCallback(() => {
    // Step 1: Validate inputs
    const ve = validateInputs(input);
    setErrors(ve);
    if (hasHardErrors(ve)) return;

    // Step 2: Diabetes detection gate (ADA 2025)
    const gate = checkDiabetesGate(input);
    setDiabetesGate(gate);

    if (gate?.blocked) return; // Hard block — definite diabetes
    if (gate?.softBlocked && !diabetesAcknowledged) return; // Soft block — needs acknowledgment

    // Step 3: Run prediction
    startTransition(() => { setResult(predict(input)); });
  }, [input, diabetesAcknowledged]);

  const handleClear = useCallback(() => {
    setInput({}); setResult(null); setErrors([]);
    setDiabetesGate(null); setDiabetesAcknowledged(false);
  }, []);

  const handleFillSample = useCallback((profile: RiskProfile) => {
    const data = generatePatientByRisk(profile);
    setInput(data);
    setResult(null);
    setErrors([]);
    setDiabetesGate(null);
    setDiabetesAcknowledged(false);
  }, []);

  const renderField = (f: FieldDef) => {
    const fieldError = errors.find(e => e.field === f.key);
    const val = input[f.key];

    if (f.type === 'select' && f.options) {
      return (
        <div key={f.key} className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">
            {f.label} <InfoTooltip text={f.info} />
          </label>
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-base sm:text-sm focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] outline-none min-h-[44px]"
            value={val != null ? String(val) : ''}
            onChange={e => updateField(f.key, e.target.value)}
          >
            <option value="">Select...</option>
            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {fieldError && <p className={`text-xs mt-1 ${fieldError.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>{fieldError.message}</p>}
        </div>
      );
    }

    return (
      <div key={f.key} className="flex flex-col">
        <label className="text-xs font-medium text-gray-600 mb-1">
          {f.label} {f.unit && <span className="text-gray-400">({f.unit})</span>}
          <InfoTooltip text={f.info} />
        </label>
        <input
          type="number"
          step={f.step || 'any'}
          className={`rounded-md border px-3 py-2.5 text-base sm:text-sm bg-white focus:ring-1 outline-none min-h-[44px] ${
            fieldError?.severity === 'error' ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : fieldError?.severity === 'warning' ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-200'
            : 'border-gray-300 focus:border-[#1E3A5F] focus:ring-[#1E3A5F]'
          }`}
          value={val != null ? String(val) : ''}
          onChange={e => updateField(f.key, e.target.value)}
        />
        {fieldError && <p className={`text-xs mt-1 ${fieldError.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>{fieldError.message}</p>}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1E3A5F]">Risk Calculator</h1>
          <p className="text-sm text-gray-500 mt-1">Enter patient laboratory values. All computation occurs locally.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleFillSample('low')}
            className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors min-h-[44px]">
            Sample: Low Risk
          </button>
          <button onClick={() => handleFillSample('moderate')}
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors min-h-[44px]">
            Sample: Moderate
          </button>
          <button onClick={() => handleFillSample('high')}
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors min-h-[44px]">
            Sample: High Risk
          </button>
          <button onClick={() => handleFillSample('random')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px]">
            Random
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Optional patient identification */}
          <div className="rounded-xl border border-gray-200 p-5 bg-white">
            <h2 className="text-sm font-semibold text-[#1E3A5F] mb-1">Patient Identification (Optional)</h2>
            <p className="text-[10px] text-gray-400 mb-3">For report purposes only. All data is processed locally in your browser — nothing is transmitted to or stored on any server.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g., Ahmed M."
                  className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-base sm:text-sm focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] outline-none min-h-[44px]"
                  value={input.patient_name || ''}
                  onChange={e => setInput(prev => ({ ...prev, patient_name: e.target.value || undefined }))}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600 mb-1">
                  MRN / EHR ID
                </label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="e.g., MRN-123456"
                  className="rounded-md border border-gray-300 bg-white px-3 py-2.5 text-base sm:text-sm focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] outline-none min-h-[44px]"
                  value={input.patient_mrn || ''}
                  onChange={e => setInput(prev => ({ ...prev, patient_mrn: e.target.value || undefined }))}
                />
              </div>
            </div>
          </div>

          {FORM_SECTIONS.map(section => (
            <div key={section.title} className="rounded-xl border border-gray-200 p-4 sm:p-5 bg-white">
              <h2 className="text-sm font-semibold text-[#1E3A5F] mb-3">{section.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {section.fields.map(renderField)}
              </div>
              {/* BMI class annotation within Comorbidities section */}
              {section.title === 'Comorbidities' && input.bmi != null && (
                <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">BMI {input.bmi.toFixed(1)} kg/m{'\u00B2'}</span>
                    {' \u2014 '}
                    <span className={`font-semibold ${getBmiClass(input.bmi).color}`}>
                      {getBmiClass(input.bmi).label}
                    </span>
                    {input.bmi >= 30 && (
                      <span className="text-gray-500">
                        {' '} | Obesity auto-set to Yes
                      </span>
                    )}
                    {input.bmi >= 35 && (
                      <span className="text-gray-500">
                        {' '} | Meets ADA Rec. 3.7 BMI {'\u2265'}35 threshold for metformin
                      </span>
                    )}
                    {input.bmi >= 30 && input.bmi < 35 && (
                      <span className="text-gray-500">
                        {' '} | Below ADA BMI {'\u2265'}35 threshold for strongest metformin evidence
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Historical */}
          <div className="rounded-xl border border-gray-200 p-4 sm:p-5 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#1E3A5F]">
                Historical Laboratory Data (Optional)
              </h2>
              <button className="text-xs text-blue-600 hover:underline px-2 py-1 min-h-[44px] flex items-center" onClick={() => setShowHistorical(!showHistorical)}>
                {showHistorical ? 'Hide' : 'Show'}
              </button>
            </div>
            {showHistorical && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {HISTORICAL.map(renderField)}
              </div>
            )}
            {!showHistorical && (
              <p className="text-xs text-gray-400">
                If prior laboratory records are available, providing historical values improves prediction accuracy.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 text-xs sm:text-sm text-gray-600 cursor-pointer py-1">
              <input type="checkbox" checked={disclaimerAccepted} onChange={e => setDisclaimerAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 flex-shrink-0" />
              I understand this is a clinical decision support tool. Predictions must be interpreted in the context of the patient&apos;s complete clinical picture.
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handlePredict} disabled={!disclaimerAccepted || isPending}
                className="rounded-lg bg-[#1E3A5F] px-6 py-3 text-white font-semibold hover:bg-[#2a4f7a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto min-h-[44px]">
                {isPending ? 'Calculating...' : 'Calculate Risk Score'}
              </button>
              <button onClick={handleClear}
                className="rounded-lg border border-gray-300 px-6 py-3 text-gray-600 font-medium hover:bg-gray-50 w-full sm:w-auto min-h-[44px]">
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Results */}
        <div className="lg:col-span-1">
          {/* Diabetes detection gate — persists alongside results if soft-block was acknowledged */}
          {diabetesGate && (!result || diabetesAcknowledged) && (
            <div className={`rounded-xl border-2 p-5 mb-6 ${diabetesGate.blocked ? 'border-red-500 bg-red-50' : 'border-amber-500 bg-amber-50'}`}>
              <h3 className={`text-sm font-bold ${diabetesGate.blocked ? 'text-red-800' : 'text-amber-800'}`}>
                {diabetesGate.title}
              </h3>
              <p className="text-xs text-gray-700 mt-2 leading-relaxed">{diabetesGate.message}</p>
              {diabetesGate.recommendations.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-700">Recommended next steps:</p>
                  <ul className="text-xs text-gray-600 mt-1 space-y-1 list-disc pl-4">
                    {diabetesGate.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {diabetesGate.softBlocked && !diabetesGate.blocked && (
                <div className="mt-4 border-t border-amber-300 pt-3">
                  <label className="flex items-start gap-3 text-xs text-amber-800 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={diabetesAcknowledged}
                      onChange={e => setDiabetesAcknowledged(e.target.checked)}
                      className="mt-0.5 w-4 h-4 flex-shrink-0"
                    />
                    I acknowledge this patient may have diabetes and wish to proceed with prediabetes risk estimation.
                  </label>
                  {diabetesAcknowledged && (
                    <button
                      onClick={handlePredict}
                      disabled={isPending}
                      className="mt-2 rounded-lg bg-amber-600 px-4 py-2.5 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 w-full sm:w-auto min-h-[44px]"
                    >
                      {isPending ? 'Calculating...' : 'Proceed with Prediction'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {result ? (
            <div className="lg:sticky lg:top-20 space-y-6">
              <div className="rounded-xl border border-gray-200 p-5" style={{ backgroundColor: result.band.bgColor }}>
                <RiskGauge srs={result.srs} band={result.band} probability={result.probability} ci={result.confidenceInterval} confidenceLevel={result.confidenceLevel} />
              </div>
              <div className="rounded-xl border border-gray-200 p-5 bg-white">
                <h3 className="text-sm font-semibold text-gray-700">Clinical Interpretation</h3>
                <div className="mt-2 text-xs text-gray-600 space-y-2">
                  <p><strong>Annual Conversion Rate:</strong> {result.band.annualRate}</p>
                  <p><strong>NNT (Lifestyle):</strong> {result.band.nntLifestyle}</p>
                  <p><strong>Recommended Action:</strong> {result.band.action}</p>
                  <p className="text-gray-400">
                    Mode: {result.modelTier === 'enhanced' ? 'Enhanced (with historical data)' : 'Standard (current visit only)'}
                  </p>
                  <p className="text-gray-400">
                    Confidence:{' '}
                    <span className={
                      result.confidenceLevel === 'high' ? 'text-green-600 font-medium' :
                      result.confidenceLevel === 'medium' ? 'text-amber-600 font-medium' :
                      'text-red-600 font-medium'
                    }>
                      {result.confidenceLevel === 'high' ? 'High' : result.confidenceLevel === 'medium' ? 'Medium' : 'Low'}
                    </span>
                    {' '}(based on data completeness)
                  </p>
                </div>
              </div>
              {/* BMI context box — shown when BMI is provided */}
              {input.bmi != null && (
                <div className="rounded-xl border border-gray-200 p-5 bg-white">
                  <h3 className="text-sm font-semibold text-gray-700">BMI Context</h3>
                  <div className="mt-2 text-xs text-gray-600 space-y-1.5">
                    <p>
                      <strong>BMI:</strong> {input.bmi.toFixed(1)} kg/m{'\u00B2'}{' '}
                      <span className={`font-semibold ${getBmiClass(input.bmi).color}`}>
                        ({getBmiClass(input.bmi).label})
                      </span>
                    </p>
                    {input.bmi >= 30 && input.bmi < 35 && (
                      <p className="text-amber-700">
                        Patient BMI {input.bmi.toFixed(1)} is below the BMI {'\u2265'}35 threshold where metformin shows strongest evidence (ADA Rec. 3.7).
                      </p>
                    )}
                    {input.bmi >= 35 && (
                      <p className="text-red-700">
                        Patient BMI {input.bmi.toFixed(1)} meets the ADA Rec. 3.7 BMI {'\u2265'}35 threshold for strongest metformin evidence.
                      </p>
                    )}
                  </div>
                </div>
              )}
              {/* Obesity counterfactual — shows what-if for toggling obesity */}
              {result && (() => {
                const currentObesity = input.dx_obesity === 1 ? 1 : 0;
                const flippedInput = { ...input, dx_obesity: currentObesity === 1 ? 0 : 1 };
                const flippedResult = predict(flippedInput);
                const withObesityProb = currentObesity === 1 ? result.probability : flippedResult.probability;
                const withoutObesityProb = currentObesity === 1 ? flippedResult.probability : result.probability;
                const delta = withObesityProb - withoutObesityProb;
                return (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-xs font-semibold text-indigo-800">Obesity Impact (Counterfactual)</p>
                    <div className="mt-2 text-xs text-indigo-700 space-y-1">
                      <p>With obesity: <strong>{(withObesityProb * 100).toFixed(1)}%</strong> 2-year risk</p>
                      <p>Without obesity: <strong>{(withoutObesityProb * 100).toFixed(1)}%</strong> 2-year risk</p>
                      <p className="text-indigo-600">
                        Obesity adds <strong>+{(delta * 100).toFixed(1)} percentage points</strong>{' '}to this patient&apos;s predicted risk.
                      </p>
                    </div>
                    <p className="mt-2 text-[10px] text-indigo-400">
                      Counterfactual: all other inputs held constant, only obesity status toggled.
                    </p>
                  </div>
                );
              })()}
              {result.confidenceLevel === 'low' && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                  <p className="text-xs text-amber-800 font-medium">Limited Data</p>
                  <p className="text-xs text-amber-700 mt-1">This prediction is based on fewer than half of the available features. Provide additional laboratory values for a more reliable estimate.</p>
                </div>
              )}
              <div className="rounded-xl border border-gray-200 p-5 bg-white">
                <ShapChart shapValues={result.shapValues} groupContributions={result.groupContributions} />
              </div>
              <div className="rounded-xl border border-gray-200 p-5 bg-white">
                <PDFDownloadButton result={result} input={input} />
              </div>
              <div className="rounded-xl border border-gray-200 p-5 bg-white">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Risk Level Reference</h3>
                <div className="space-y-1">
                  {([1, 2, 3, 4, 5, 6] as const).map(tier => {
                    const b = BANDS[tier];
                    return (
                      <div key={tier}
                        className={`flex items-center gap-2 text-xs rounded px-2 py-1 ${result.band.tier === tier ? 'ring-2 ring-offset-1' : ''}`}
                        style={result.band.tier === tier ? { outlineColor: b.color, boxShadow: `0 0 0 2px ${b.color}33` } : {}}>
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                        <span className="font-medium w-24">{b.label}</span>
                        <span className="text-gray-500">{b.annualRate}/yr</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
              <p className="text-sm">Enter patient data and click &ldquo;Calculate Risk Score&rdquo; to see results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
