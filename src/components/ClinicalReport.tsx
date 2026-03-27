'use client';

import {
  Document, Page, Text, View, Image, StyleSheet,
} from '@react-pdf/renderer';
import type { PredictionResult, PatientInput } from '@/lib/types';
import { predict } from '@/lib/model';

const navy = '#1E3A5F';
const gray = '#4B5563';
const lightGray = '#F3F4F6';

const s = StyleSheet.create({
  page: { paddingTop: 72, paddingBottom: 60, paddingHorizontal: 50, fontSize: 10, fontFamily: 'Helvetica', color: '#1F2937' },
  header: { position: 'absolute', top: 18, left: 50, right: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: navy, paddingBottom: 6 },
  headerLogo: { width: 40, height: 40 },
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: navy, textAlign: 'center' },
  headerSub: { fontSize: 7, color: gray, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 20, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#9CA3AF', borderTopWidth: 0.5, borderTopColor: '#D1D5DB', paddingTop: 4 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: navy, marginTop: 16, marginBottom: 6, textAlign: 'center' },
  sectionTitleLeft: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: navy, marginTop: 16, marginBottom: 6 },
  h3: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#374151', marginTop: 10, marginBottom: 4 },
  body: { fontSize: 10, lineHeight: 1.5, marginBottom: 4 },
  bodySmall: { fontSize: 9, lineHeight: 1.4, color: gray },
  bold: { fontFamily: 'Helvetica-Bold' },
  scoreBox: { alignItems: 'center', marginVertical: 12, padding: 16, borderRadius: 8 },
  scoreNumber: { fontSize: 42, fontFamily: 'Helvetica-Bold', color: 'white' },
  scoreLabel: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: 'white', marginTop: 4 },
  scoreSub: { fontSize: 10, color: 'white', marginTop: 2 },
  table: { marginVertical: 6 },
  tableHeader: { flexDirection: 'row', backgroundColor: navy, paddingVertical: 4, paddingHorizontal: 6 },
  tableHeaderCell: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: 'white' },
  tableRow: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  tableRowAlt: { backgroundColor: lightGray },
  tableCell: { fontSize: 8 },
  shapRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  shapLabel: { width: 130, fontSize: 8, textAlign: 'right', paddingRight: 6 },
  shapBarContainer: { flex: 1, height: 10 },
  shapBar: { height: 10, borderRadius: 2 },
  shapValue: { width: 45, fontSize: 7, textAlign: 'right' },
  disclaimer: { marginTop: 14, padding: 10, backgroundColor: '#FFFBEB', borderWidth: 0.5, borderColor: '#F59E0B', borderRadius: 4 },
  disclaimerText: { fontSize: 8, lineHeight: 1.4, color: '#92400E' },
});

function Header() {
  return (
    <View style={s.header} fixed>
      <Image style={s.headerLogo} src="/logos/PSMMC.png" />
      <View style={s.headerCenter}>
        <Text style={s.headerTitle}>SauDRS — Clinical Risk Assessment Report</Text>
        <Text style={s.headerSub}>Prince Sultan Military Medical City | Ministry of Defense Health Services</Text>
      </View>
      <Image style={s.headerLogo} src="/logos/MOD.png" />
    </View>
  );
}

function Footer({ reportId }: { reportId: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>Report ID: {reportId}</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function interpretValue(feature: string, value: number): string {
  const rules: Record<string, (v: number) => string> = {
    hba1c: v => v < 5.7 ? 'Normal' : v < 6.5 ? 'Prediabetic range' : 'Diabetic range',
    fasting_glucose: v => v < 5.6 ? 'Normal' : v < 7.0 ? 'Impaired' : 'Diabetic range',
    hdl: v => v > 1.3 ? 'Desirable' : v > 1.0 ? 'Borderline' : 'Low',
    ldl: v => v < 2.6 ? 'Optimal' : v < 3.4 ? 'Near optimal' : 'Borderline high',
    triglyceride: v => v < 1.7 ? 'Normal' : v < 2.3 ? 'Borderline' : 'High',
    systolic_bp: v => v < 120 ? 'Normal' : v < 130 ? 'Elevated' : 'Hypertensive',
    hemoglobin: v => v > 12 ? 'Normal' : 'Low',
    alt: v => v < 40 ? 'Normal' : 'Elevated',
    creatinine: v => v < 106 ? 'Normal' : 'Elevated',
  };
  const fn = rules[feature];
  return fn ? fn(value) : '';
}

function classifyBmi(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  if (bmi < 35) return 'Class I Obesity (WHO)';
  if (bmi < 40) return 'Class II Obesity (WHO)';
  return 'Class III Obesity (WHO)';
}

interface ClinicalReportProps {
  result: PredictionResult;
  input: PatientInput;
}

export function ClinicalReport({ result, input }: ClinicalReportProps) {
  const now = new Date();
  const reportId = `SRS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const topRisk = result.shapValues.filter(sv => sv.shap > 0).slice(0, 7);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Header />
        <Footer reportId={reportId} />

        {/* Centered title */}
        <Text style={s.sectionTitle}>Clinical Risk Assessment Report</Text>

        {/* Report info with optional patient name */}
        <View style={{ marginBottom: 8 }}>
          <Text style={s.bodySmall}>Report Date: {dateStr}  |  Report ID: {reportId}</Text>
          {(input.patient_name || input.patient_mrn) && (
            <Text style={[s.body, { marginTop: 4 }]}>
              {input.patient_name && <Text><Text style={s.bold}>Patient: </Text>{input.patient_name}</Text>}
              {input.patient_mrn && <Text>  |  <Text style={s.bold}>MRN: </Text>{input.patient_mrn}</Text>}
              {input.age != null && <Text>  |  Age: {input.age} years</Text>}
              {input.male != null && <Text>  |  Sex: {input.male === 1 ? 'Male' : 'Female'}</Text>}
            </Text>
          )}
        </View>

        <Text style={s.sectionTitleLeft}>1. SauDRS Risk Score</Text>
        <View style={[s.scoreBox, { backgroundColor: result.band.color }]}>
          <Text style={s.scoreNumber}>{result.srs}</Text>
          <Text style={s.scoreLabel}>{result.band.label}</Text>
          <Text style={s.scoreSub}>
            2-Year Conversion Probability: {(result.probability * 100).toFixed(1)}%
            {'  '}| Estimate Reliability: {result.confidenceLevel === 'high' ? 'High' : result.confidenceLevel === 'medium' ? 'Moderate' : 'Low'}
          </Text>
        </View>

        <Text style={s.sectionTitleLeft}>2. Patient Clinical Summary</Text>
        {/* Patient summary table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: 130 }]}>Parameter</Text>
            <Text style={[s.tableHeaderCell, { width: 100 }]}>Value</Text>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>Interpretation</Text>
          </View>
          {[
            input.age != null && ['Age', `${input.age} years`, input.age > 55 ? 'Increased risk with age' : ''],
            input.male != null && ['Sex', input.male === 1 ? 'Male' : 'Female', ''],
            input.hba1c != null && ['HbA1c', `${input.hba1c}%`, interpretValue('hba1c', input.hba1c)],
            input.fasting_glucose != null && ['Fasting Glucose', `${input.fasting_glucose} mmol/L`, interpretValue('fasting_glucose', input.fasting_glucose)],
            input.hdl != null && ['HDL', `${input.hdl} mmol/L`, interpretValue('hdl', input.hdl)],
            input.ldl != null && ['LDL', `${input.ldl} mmol/L`, interpretValue('ldl', input.ldl)],
            input.total_cholesterol != null && ['Total Cholesterol', `${input.total_cholesterol} mmol/L`, ''],
            input.triglyceride != null && ['Triglycerides', `${input.triglyceride} mmol/L`, interpretValue('triglyceride', input.triglyceride)],
            input.creatinine != null && ['Creatinine', `${input.creatinine} umol/L`, interpretValue('creatinine', input.creatinine)],
            input.alt != null && ['ALT', `${input.alt} U/L`, interpretValue('alt', input.alt)],
            input.hemoglobin != null && ['Hemoglobin', `${input.hemoglobin} g/dL`, interpretValue('hemoglobin', input.hemoglobin)],
            input.systolic_bp != null && ['Systolic BP', `${input.systolic_bp} mmHg`, interpretValue('systolic_bp', input.systolic_bp)],
            input.diastolic_bp != null && ['Diastolic BP', `${input.diastolic_bp} mmHg`, ''],
            input.dx_hypertension != null && ['Hypertension', input.dx_hypertension === 1 ? 'Yes' : 'No', input.dx_hypertension === 1 ? 'Cardiovascular risk factor' : ''],
            input.dx_dyslipidemia != null && ['Dyslipidemia', input.dx_dyslipidemia === 1 ? 'Yes' : 'No', input.dx_dyslipidemia === 1 ? 'Metabolic risk factor' : ''],
            input.bmi != null && ['BMI', `${input.bmi.toFixed(1)} kg/m\u00B2`, classifyBmi(input.bmi)],
            input.dx_obesity != null && ['Obesity', input.dx_obesity === 1 ? 'Yes' : 'No', input.dx_obesity === 1 ? 'Strong risk factor for conversion' : ''],
            input.dx_hypothyroidism != null && ['Hypothyroidism', input.dx_hypothyroidism === 1 ? 'Yes' : 'No', input.dx_hypothyroidism === 1 ? 'Under endocrine follow-up' : ''],
          ].filter(Boolean).map((row, i) => {
            const [label, val, interp] = row as [string, string, string];
            return (
              <View key={label} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.tableCell, { width: 130 }]}>{label}</Text>
                <Text style={[s.tableCell, { width: 100 }]}>{val}</Text>
                <Text style={[s.tableCell, { flex: 1, color: '#6B7280', fontStyle: 'italic' }]}>{interp}</Text>
              </View>
            );
          })}
        </View>

        <Text style={s.sectionTitleLeft}>3. Risk Classification</Text>
        <Text style={s.body}>
          The patient falls in the <Text style={s.bold}>{result.band.label}</Text> category
          (SRS {result.srs}, annual conversion rate {result.band.annualRate}).
        </Text>
        {/* Band table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: 70 }]}>Level</Text>
            <Text style={[s.tableHeaderCell, { width: 55 }]}>Score</Text>
            <Text style={[s.tableHeaderCell, { width: 60 }]}>2-Yr Risk</Text>
            <Text style={[s.tableHeaderCell, { width: 70 }]}>Annual Rate</Text>
          </View>
          {[
            { tier: 1, label: 'Minimal', range: '0-25', prob: '< 5%', rate: '< 2.5%', color: '#22C55E' },
            { tier: 2, label: 'Low', range: '26-40', prob: '5-10%', rate: '2.5-5.1%', color: '#16A34A' },
            { tier: 3, label: 'Moderate', range: '41-56', prob: '10-20%', rate: '5.1-10.6%', color: '#CA8A04' },
            { tier: 4, label: 'High', range: '57-71', prob: '20-35%', rate: '10.6-19.5%', color: '#EA580C' },
            { tier: 5, label: 'Very High', range: '72-83', prob: '35-50%', rate: '19.5-29.3%', color: '#DC2626' },
            { tier: 6, label: 'Critical', range: '84-100', prob: '> 50%', rate: '> 29.3%', color: '#7F1D1D' },
          ].map((b, i) => (
            <View key={b.tier} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}, result.band.tier === b.tier ? { backgroundColor: b.color + '22', borderLeftWidth: 2, borderLeftColor: b.color } : {}]}>
              <Text style={[s.tableCell, { width: 70, fontFamily: result.band.tier === b.tier ? 'Helvetica-Bold' : 'Helvetica' }]}>{b.label}</Text>
              <Text style={[s.tableCell, { width: 55 }]}>{b.range}</Text>
              <Text style={[s.tableCell, { width: 60 }]}>{b.prob}</Text>
              <Text style={[s.tableCell, { width: 70 }]}>{b.rate}</Text>
            </View>
          ))}
        </View>
      </Page>

      <Page size="A4" style={s.page}>
        <Header />
        <Footer reportId={reportId} />

        <Text style={[s.sectionTitleLeft, { marginTop: 0 }]}>4. Understanding Risk Metrics</Text>
        <Text style={s.body}>
          The following table summarizes the key risk metrics computed for this patient and their clinical significance.
        </Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: 100 }]}>Metric</Text>
            <Text style={[s.tableHeaderCell, { width: 65 }]}>Value</Text>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>Interpretation</Text>
            <Text style={[s.tableHeaderCell, { width: 130 }]}>Clinical Use</Text>
          </View>
          {[
            [
              'SauDRS Risk Score',
              `${result.srs}/100`,
              `Score of ${result.srs} places this patient in the ${result.band.label} category. Scores above 50 indicate above-median risk.`,
              'Primary screening metric for risk tier assignment',
            ],
            [
              '2-Year Conversion Risk',
              `${(result.probability * 100).toFixed(1)}%`,
              `Estimated ${(result.probability * 100).toFixed(1)}% probability of developing diabetes within 2 years`,
              'Most actionable metric for shared decision-making with patients',
            ],
            [
              'Annual Conversion Rate',
              `${result.band.annualRate}`,
              'Estimated yearly risk assuming stable risk factors',
              'Determines monitoring frequency (annual to monthly based on rate)',
            ],
            [
              'NNT (Lifestyle)',
              `${result.band.nntLifestyle}`,
              'Number of patients at this risk level needing 3-year DPP-style lifestyle intervention to prevent one diabetes case',
              'Resource allocation and intervention prioritization',
            ],
          ].map((row, i) => (
            <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tableCell, { width: 100, fontFamily: 'Helvetica-Bold' }]}>{row[0]}</Text>
              <Text style={[s.tableCell, { width: 65 }]}>{row[1]}</Text>
              <Text style={[s.tableCell, { flex: 1, color: '#6B7280', fontStyle: 'italic' }]}>{row[2]}</Text>
              <Text style={[s.tableCell, { width: 130 }]}>{row[3]}</Text>
            </View>
          ))}
        </View>

        {/* Clinical Decision Guide — tier-specific, evidence-based */}
        <Text style={[s.h3, { marginTop: 14 }]}>Clinical Decision Guide for This Patient</Text>
        <Text style={s.body}>
          Based on the {result.band.label} classification (Tier {result.band.tier}), the following evidence-based recommendations apply:
        </Text>

        {/* Tier-specific ADA guidance */}
        <View style={[s.table, { marginTop: 6 }]}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: 120 }]}>Domain</Text>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>Recommendation</Text>
            <Text style={[s.tableHeaderCell, { width: 100 }]}>Evidence</Text>
          </View>
          {[
            [
              'Monitoring',
              result.band.tier <= 1 ? 'HbA1c every 12 months'
                : result.band.tier === 2 ? 'HbA1c every 6 months'
                : result.band.tier === 3 ? 'HbA1c every 3 months'
                : result.band.tier === 4 ? 'HbA1c + fasting glucose every 2-3 months'
                : result.band.tier === 5 ? 'HbA1c + fasting glucose monthly'
                : 'Urgent: HbA1c + fasting glucose + OGTT within 2 weeks',
              'ADA 2025 Sec. 3',
            ],
            [
              'Lifestyle',
              result.band.tier <= 2
                ? 'Standard counseling: healthy diet, 150 min/week moderate physical activity, 5-7% weight loss goal'
                : 'Intensive DPP-style structured program: 16-session curriculum over 24 weeks targeting >= 7% weight loss and >= 150 min/week physical activity',
              'DPP (NEJM 2002)',
            ],
            [
              'Metformin',
              result.band.tier <= 2 ? 'Not indicated at current risk level'
                : result.band.tier === 3
                  ? ('Consider if age 25-59 with BMI >= 35 kg/m2, FPG >= 6.1 mmol/L, or HbA1c >= 6.0%.'
                    + (input.bmi != null
                      ? ` Patient BMI: ${input.bmi.toFixed(1)} kg/m\u00B2 \u2014 ${input.bmi >= 35 ? 'meets' : 'below'} the BMI >= 35 threshold for strongest metformin evidence.`
                      : ''))
                : ('Evaluate for initiation per ADA Recommendation 3.7; discuss benefits (31% RRR) and side effects with patient.'
                    + (input.bmi != null
                      ? ` Patient BMI: ${input.bmi.toFixed(1)} kg/m\u00B2 (${classifyBmi(input.bmi)}) \u2014 ${input.bmi >= 35 ? 'meets' : 'below'} BMI >= 35 threshold.`
                      : '')),
              'ADA 2025 Rec. 3.7',
            ],
            [
              'Specialist Referral',
              result.band.tier <= 3 ? 'Not required; manage in primary care'
                : result.band.tier === 4 ? 'Consider endocrinology if metformin initiated or comorbidities present'
                : 'Endocrinology referral recommended; OGTT to exclude existing diabetes',
              'ADA 2025 Sec. 2-3',
            ],
            [
              'Complication Screening',
              result.band.tier <= 3 ? 'Standard age-appropriate screening'
                : 'Retinopathy screening, nephropathy assessment (eGFR + ACR), cardiovascular risk evaluation (lipid panel, BP)',
              'ADA 2025 Sec. 4, 10-12',
            ],
          ].map((row, i) => (
            <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tableCell, { width: 120, fontFamily: 'Helvetica-Bold' }]}>{row[0]}</Text>
              <Text style={[s.tableCell, { flex: 1 }]}>{row[1]}</Text>
              <Text style={[s.tableCell, { width: 100, color: '#6B7280', fontStyle: 'italic' }]}>{row[2]}</Text>
            </View>
          ))}
        </View>

        {/* Key Evidence Summary */}
        <Text style={[s.h3, { marginTop: 12 }]}>Key Evidence: Diabetes Prevention Program (DPP)</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={[s.bodySmall, { fontFamily: 'Helvetica-Bold' }]}>Lifestyle Intervention</Text>
            <Text style={s.bodySmall}>58% reduction in conversion (HR 0.42)</Text>
            <Text style={s.bodySmall}>Effective across all ages, sexes, and ethnicities</Text>
            <Text style={s.bodySmall}>Benefits persist at 15-year follow-up (DPPOS)</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.bodySmall, { fontFamily: 'Helvetica-Bold' }]}>Metformin</Text>
            <Text style={s.bodySmall}>31% reduction in conversion (HR 0.69)</Text>
            <Text style={s.bodySmall}>Most effective in patients age 25-59, BMI {'>='}  35</Text>
            <Text style={s.bodySmall}>No benefit in lowest-risk quartile (DPP Q1)</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.bodySmall, { fontFamily: 'Helvetica-Bold' }]}>Saudi Context</Text>
            <Text style={s.bodySmall}>37% higher conversion rate vs. European populations</Text>
            <Text style={s.bodySmall}>Mean BMI 33.8 kg/m2 in Saudi prediabetics</Text>
            <Text style={s.bodySmall}>High metabolic syndrome prevalence ({'>'} 40%)</Text>
          </View>
        </View>

        {/* Important caveats */}
        <View style={[s.disclaimer, { marginTop: 10 }]}>
          <Text style={s.disclaimerText}>
            IMPORTANT: These recommendations are generated by a clinical decision support algorithm based on ADA 2025 Standards of Care and DPP trial evidence. They do not replace individualized clinical judgment. Medication decisions, specialist referrals, and monitoring schedules must account for the complete clinical picture including patient preferences, comorbidities, contraindications, and local practice guidelines.
          </Text>
        </View>

      </Page>

      <Page size="A4" style={s.page}>
        <Header />
        <Footer reportId={reportId} />

        <Text style={[s.sectionTitleLeft, { marginTop: 0 }]}>5. Key Risk Factors by Clinical Domain</Text>
        <View>
          {(() => {
            const riskGroups = result.groupContributions.filter(g => g.totalShap > 0).slice(0, 8);
            const maxVal = Math.max(...riskGroups.map(v => v.totalShap), 0.01);
            return riskGroups.map((gc, i) => {
              const pct = Math.min((gc.totalShap / maxVal) * 100, 100);
              return (
                <View key={i} style={s.shapRow}>
                  <Text style={s.shapLabel}>{gc.group}</Text>
                  <View style={s.shapBarContainer}>
                    <View style={[s.shapBar, { width: `${pct}%`, backgroundColor: '#EF4444' }]} />
                  </View>
                  <Text style={[s.shapValue, { color: '#DC2626' }]}>
                    +{gc.totalShap.toFixed(2)}
                  </Text>
                </View>
              );
            });
          })()}
        </View>
        <Text style={[s.bodySmall, { marginTop: 4, fontStyle: 'italic' }]}>
          Showing risk-increasing contributions by clinical domain. Higher values indicate stronger contribution to predicted risk.
        </Text>

        {/* Top risk-increasing factors with clinical values */}
        <View style={{ marginTop: 10 }}>
          <Text style={[s.h3, { color: '#DC2626' }]}>Key Risk-Increasing Factors</Text>
          {topRisk.map((sv, i) => (
            <Text key={i} style={s.bodySmall}>
              {i + 1}. {sv.displayName}: {typeof sv.value === 'number' ? sv.value.toFixed(1) : sv.value}
              {sv.feature && (() => { const interp = interpretValue(sv.feature, sv.value); return interp ? ` (${interp})` : ''; })()}
            </Text>
          ))}
        </View>

        {/* Fixed: use >= instead of unicode ≥ which Helvetica cannot render */}
        <Text style={s.sectionTitleLeft}>6. Recommended Clinical Actions</Text>
        <Text style={s.body}>{
          result.band.action
            .replace(/\u2265/g, '>=')
            .replace(/\u2264/g, '<=')
        }</Text>
        <Text style={[s.bodySmall, { marginTop: 4 }]}>
          NNT for lifestyle intervention at this risk level: {result.band.nntLifestyle} (based on DPP 3-year lifestyle intervention, 58% risk reduction)
        </Text>

        <Text style={s.sectionTitleLeft}>7. Recommended Follow-Up</Text>
        <Text style={s.body}>
          {result.band.tier <= 1 && 'Annual HbA1c monitoring (every 12 months). Reassess if new risk factors develop.'}
          {result.band.tier === 2 && 'Biannual HbA1c monitoring (every 6 months). Structured lifestyle program referral.'}
          {result.band.tier === 3 && 'Quarterly HbA1c monitoring (every 3 months). Intensive lifestyle program. Consider metformin per ADA 2025 criteria (age 25-59, BMI >=35, FPG >=110 mg/dL, or HbA1c >=6.0%).'}
          {result.band.tier === 4 && 'Bimonthly monitoring (every 2-3 months). HbA1c + fasting glucose. Metformin evaluation. Ophthalmology/nephrology screening.'}
          {result.band.tier === 5 && 'Monthly monitoring with HbA1c + fasting glucose. Metformin initiation. Endocrinology referral. OGTT to exclude diabetes.'}
          {result.band.tier >= 6 && 'Urgent specialist referral within 2 weeks. Metformin + intensive lifestyle. OGTT/CGM to rule out diabetes. Full complication screening.'}
        </Text>

        {/* Obesity Counterfactual Analysis */}
        {(() => {
          const currentObesity = input.dx_obesity === 1 ? 1 : 0;
          const flippedInput = { ...input, dx_obesity: currentObesity === 1 ? 0 : 1 };
          const flippedResult = predict(flippedInput);
          const withObesityProb = currentObesity === 1 ? result.probability : flippedResult.probability;
          const withoutObesityProb = currentObesity === 1 ? flippedResult.probability : result.probability;
          const delta = withObesityProb - withoutObesityProb;
          return (
            <View style={{ marginTop: 10, padding: 8, backgroundColor: '#EEF2FF', borderRadius: 4, borderWidth: 0.5, borderColor: '#A5B4FC' }}>
              <Text style={[s.bodySmall, { fontFamily: 'Helvetica-Bold', color: '#3730A3' }]}>Obesity Impact (Counterfactual Analysis)</Text>
              <Text style={[s.bodySmall, { marginTop: 3 }]}>
                With obesity: {(withObesityProb * 100).toFixed(1)}% 2-year risk  |  Without obesity: {(withoutObesityProb * 100).toFixed(1)}% 2-year risk
              </Text>
              <Text style={[s.bodySmall, { color: '#4338CA' }]}>
                Obesity adds +{(delta * 100).toFixed(1)} percentage points to this patient's predicted risk (all other inputs held constant).
              </Text>
              {input.bmi != null && (
                <Text style={[s.bodySmall, { marginTop: 2 }]}>
                  Patient BMI: {input.bmi.toFixed(1)} kg/m{'\u00B2'} ({classifyBmi(input.bmi)})
                  {input.bmi >= 35 ? ' \u2014 meets ADA Rec. 3.7 BMI >=35 threshold for metformin'
                    : input.bmi >= 30 ? ' \u2014 below BMI >=35 threshold for strongest metformin evidence'
                    : ''}
                </Text>
              )}
            </View>
          );
        })()}

        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            CLINICAL DISCLAIMER: This report is generated by a clinical decision support tool. All predictions must be interpreted in the context of the individual patient's complete clinical picture. This system is not intended to serve as the sole basis for clinical decision-making.
          </Text>
        </View>

        <Text style={[s.sectionTitleLeft, { fontSize: 10 }]}>References</Text>
        <Text style={[s.bodySmall, { fontSize: 7 }]}>
          1. Knowler WC, Barrett-Connor E, Fowler SE, et al. Reduction in the incidence of type 2 diabetes with lifestyle intervention or metformin. N Engl J Med. 2002;346(6):393-403. doi:10.1056/NEJMoa012512{'\n'}
          2. Sussman JB, Kent DM, Nelson JP, Hayward RA. Improving diabetes prevention with benefit based tailored treatment: risk based reanalysis of Diabetes Prevention Program. BMJ. 2015;350:h454. doi:10.1136/bmj.h454{'\n'}
          3. Diabetes Prevention Program Research Group. Long-term effects of lifestyle intervention or metformin on diabetes development and microvascular complications over 15-year follow-up: the Diabetes Prevention Program Outcomes Study. Lancet Diabetes Endocrinol. 2015;3(11):866-875. doi:10.1016/S2213-8587(15)00291-0{'\n'}
          4. American Diabetes Association Professional Practice Committee. 3. Prevention or delay of diabetes and associated comorbidities: Standards of Care in Diabetes - 2025. Diabetes Care. 2025;48(Suppl 1):S50-S66. doi:10.2337/dc25-S003{'\n'}
          5. Creatore MI, Moineddin R, Engel I, et al. Age- and sex-related prevalence of diabetes mellitus among immigrants to Ontario, Canada. CMAJ Open. 2020;8(4):E886-E893. doi:10.9778/cmajo.20200100{'\n'}
          6. Tourkmani AM, Alharbi TJ, Bin Rsheed AM, et al. Characteristics and risk factors associated with developing prediabetes in Saudi Arabia. Ann Med. 2024;56(1):2413922. doi:10.1080/07853890.2024.2413922{'\n'}
        </Text>
      </Page>

      <Page size="A4" style={s.page}>
        <Header />
        <Footer reportId={reportId} />

        <Text style={s.sectionTitleLeft}>Abbreviations</Text>
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { width: 100 }]}>Abbreviation</Text>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>Full Term</Text>
          </View>
          {[
            ['ACR', 'Albumin-to-Creatinine Ratio'],
            ['ADA', 'American Diabetes Association'],
            ['ALT', 'Alanine Aminotransferase'],
            ['BMI', 'Body Mass Index'],
            ['BP', 'Blood Pressure'],
            ['CGM', 'Continuous Glucose Monitoring'],
            ['CI', 'Confidence Interval'],
            ['DPP', 'Diabetes Prevention Program'],
            ['DPPOS', 'Diabetes Prevention Program Outcomes Study'],
            ['eGFR', 'Estimated Glomerular Filtration Rate'],
            ['FPG', 'Fasting Plasma Glucose'],
            ['HbA1c', 'Glycated Hemoglobin'],
            ['HDL', 'High-Density Lipoprotein Cholesterol'],
            ['HR', 'Hazard Ratio'],
            ['LDL', 'Low-Density Lipoprotein Cholesterol'],
            ['NNT', 'Number Needed to Treat'],
            ['OGTT', 'Oral Glucose Tolerance Test'],
            ['O:E', 'Observed-to-Expected Ratio'],
            ['PSMMC', 'Prince Sultan Military Medical City'],
            ['RRR', 'Relative Risk Reduction'],
            ['SauDRS', 'Saudi Prediabetes-to-Diabetes Risk Score'],
            ['SRS', 'SauDRS Risk Score'],
          ].map((row, i) => (
            <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tableCell, { width: 100, fontFamily: 'Helvetica-Bold' }]}>{row[0]}</Text>
              <Text style={[s.tableCell, { flex: 1 }]}>{row[1]}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
