import { BANDS } from '@/lib/model/scoring';

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F]">Model Information</h1>
      <p className="mt-2 text-sm sm:text-base text-gray-600">Clinical overview of the SauDRS risk prediction system.</p>

      {/* How It Works — Clinical */}
      <section className="mt-10">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A5F]">How the System Works</h2>
        <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
          SauDRS analyzes a patient&apos;s laboratory values, vital signs, and medical history to estimate
          the probability of converting from prediabetes to diabetes within 2 years. The system produces:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc pl-5 leading-relaxed">
          <li><strong>Conversion probability</strong> &mdash; the estimated 2-year risk of developing diabetes (percentage)</li>
          <li><strong>Risk score (0&ndash;100)</strong> &mdash; a standardized score that summarizes overall risk</li>
          <li><strong>Risk level</strong> &mdash; one of six clinical categories from &ldquo;Minimal&rdquo; to &ldquo;Critical,&rdquo; each with recommended follow-up actions</li>
          <li><strong>Contributing factors</strong> &mdash; which clinical variables are increasing or decreasing the patient&apos;s risk</li>
        </ul>
      </section>

      {/* Risk Levels */}
      <section className="mt-10">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A5F]">Risk Levels</h2>
        <p className="mt-2 text-sm text-gray-600">
          Each level corresponds to a different recommended clinical action based on the DPP trial and ADA 2025 guidelines.
        </p>
        <div className="mt-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm border-collapse min-w-[540px]">
            <thead>
              <tr className="bg-[#1E3A5F] text-white">
                <th className="px-3 py-2 text-left">Level</th>
                <th className="px-3 py-2 text-left">Score Range</th>
                <th className="px-3 py-2 text-left">Annual Conversion Rate</th>
                <th className="px-3 py-2 text-left">Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {([1, 2, 3, 4, 5, 6] as const).map((tier, i) => {
                const b = BANDS[tier];
                const ranges = ['0\u201325', '26\u201340', '41\u201356', '57\u201371', '72\u201383', '84\u2013100'];
                return (
                  <tr key={tier} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="px-3 py-2 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: b.color }} />
                      {b.label}
                    </td>
                    <td className="px-3 py-2">{ranges[i]}</td>
                    <td className="px-3 py-2">{b.annualRate}</td>
                    <td className="px-3 py-2 text-xs">{b.action}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Understanding Your Risk Assessment Results */}
      <section className="mt-10">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A5F]">Understanding Your Risk Assessment Results</h2>
        <p className="mt-3 text-gray-700">
          The SauDRS system provides four complementary risk metrics for each patient assessment. Each metric captures
          a different dimension of the patient&apos;s risk profile. Used together, they give the clinician a complete
          picture for risk stratification, patient counseling, monitoring scheduling, and resource allocation.
        </p>

        {/* 1. SauDRS Risk Score */}
        <div className="mt-6">
          <h3 className="font-semibold text-[#1E3A5F]">1. SauDRS Risk Score (SRS) &mdash; 0&ndash;100 Scale</h3>
          <div className="mt-2 space-y-2 text-sm text-gray-700">
            <p>
              <strong>What it is:</strong>{' '}A standardized composite score that summarizes all of the patient&apos;s
              clinical risk factors into a single number on a 0&ndash;100 scale.
            </p>
            <p>
              <strong>How it is calculated:</strong>{' '}The score is derived from the patient&apos;s laboratory values,
              vital signs, and medical history, which are processed through a validated logistic regression model. The
              resulting log-odds are then mapped to a 0&ndash;100 scale centered on the population median.
            </p>
            <p>
              <strong>How to interpret:</strong>{' '}Higher scores indicate higher risk. A score of 50 represents the
              median risk in the Saudi prediabetic population. Scores below 25 indicate minimal risk; scores above 83
              indicate critical risk requiring urgent clinical action.
            </p>
            <p>
              <strong>Clinical use:</strong>{' '}The SRS serves as the primary screening metric for quick risk
              stratification. It determines which of the 6 clinical action tiers (Minimal through Critical) applies
              to the patient, guiding the recommended follow-up plan.
            </p>
          </div>
        </div>

        {/* 2. Two-Year Conversion Probability */}
        <div className="mt-6">
          <h3 className="font-semibold text-[#1E3A5F]">2. Two-Year Conversion Probability (%)</h3>
          <div className="mt-2 space-y-2 text-sm text-gray-700">
            <p>
              <strong>What it is:</strong>{' '}The estimated probability that this specific patient will progress from
              prediabetes to diabetes (HbA1c &ge; 6.5%) within the next 2 years.
            </p>
            <p>
              <strong>How it is calculated:</strong>{' '}This is the direct output of the calibrated logistic regression
              model, representing a personalized risk estimate based on all available clinical features.
            </p>
            <p>
              <strong>How to interpret:</strong>{' '}A probability of 20% means that among 100 patients with similar
              clinical profiles, approximately 20 would be expected to develop diabetes within 2 years. This is a
              population-level frequency interpretation applicable at the individual level.
            </p>
            <p>
              <strong>Clinical use:</strong>{' '}This is the most clinically actionable number. It directly informs
              shared decision-making conversations with patients about lifestyle intervention intensity and
              pharmacological therapy consideration (e.g., metformin initiation per ADA guidelines).
            </p>
            <p>
              <strong>Relationship to SRS:</strong>{' '}The SRS is derived from this probability
              (SRS = 50 + K &times; logit-transform). They always move in the same direction &mdash; a higher
              2-year probability always corresponds to a higher SRS, and vice versa.
            </p>
          </div>
        </div>

        {/* 3. Annual Conversion Rate */}
        <div className="mt-6">
          <h3 className="font-semibold text-[#1E3A5F]">3. Annual Conversion Rate (%)</h3>
          <div className="mt-2 space-y-2 text-sm text-gray-700">
            <p>
              <strong>What it is:</strong>{' '}The estimated per-year probability of conversion from prediabetes to
              diabetes, derived from the 2-year probability assuming a constant hazard rate.
            </p>
            <p>
              <strong>How it is calculated:</strong>{' '}Annual rate = 1 &minus; (1 &minus; 2-year probability)<sup>0.5</sup>,
              which is the standard constant-hazard assumption used in survival analysis.
            </p>
            <p>
              <strong>How to interpret:</strong>{' '}This represents the yearly risk if the patient&apos;s risk factors
              remain stable. A 10% annual rate means approximately 1 in 10 chance of converting in any given year.
            </p>
            <p>
              <strong>Clinical use:</strong>{' '}Useful for determining monitoring frequency. Annual rates below 2.5%
              suggest yearly monitoring is adequate; rates above 10% suggest quarterly or more frequent monitoring
              with repeat HbA1c testing.
            </p>
            <p>
              <strong>Relationship to 2-year probability:</strong>{' '}The annual rate is always lower than the 2-year
              probability. For example, a 20% 2-year risk corresponds to approximately 10.6% annual rate.
            </p>
          </div>
        </div>

        {/* 4. NNT (Lifestyle) */}
        <div className="mt-6">
          <h3 className="font-semibold text-[#1E3A5F]">4. NNT (Lifestyle) &mdash; Number Needed to Treat</h3>
          <div className="mt-2 space-y-2 text-sm text-gray-700">
            <p>
              <strong>What it is:</strong>{' '}The number of patients at this risk level who would need to undergo a
              DPP-style intensive lifestyle intervention program for 3 years to prevent one additional case of
              diabetes conversion.
            </p>
            <p>
              <strong>How it is calculated:</strong>{' '}Based on the Diabetes Prevention Program (DPP) trial results,
              which demonstrated a 58% reduction in diabetes incidence with lifestyle intervention.
              NNT = 1 / (baseline risk &times; absolute risk reduction from intervention).
            </p>
            <p>
              <strong>How to interpret:</strong>{' '}Lower NNT means more efficient intervention. An NNT of 3&ndash;4
              means treating 3&ndash;4 patients prevents 1 case (highly efficient). An NNT of 20+ means treating 20 or
              more patients to prevent 1 case (less efficient at the population level, but the intervention still
              confers individual health benefits such as weight loss, cardiovascular risk reduction, and improved
              glycemic control).
            </p>
            <p>
              <strong>Clinical use:</strong>{' '}Helps clinicians and health systems prioritize resources. Patients with
              lower NNT benefit most from intensive intervention programs and should be prioritized for structured
              lifestyle modification referrals.
            </p>
            <p>
              <strong>Important caveat:</strong>{' '}NNT estimates are derived from the DPP trial (a 3-year US-based
              randomized controlled trial) and may not directly translate to the Saudi clinical context. They should
              be interpreted as approximate guides for resource allocation, not exact predictions of intervention
              efficacy in this population.
            </p>
          </div>
        </div>

        {/* Cross-metric relationship summary */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-700">
            <strong>How the metrics relate to each other:</strong>{' '}The SRS and 2-year probability always move
            together (higher SRS = higher probability). The annual rate is always lower than the 2-year probability.
            The NNT always decreases as risk increases (fewer patients needed to treat to prevent one case).
          </p>
        </div>
      </section>

      {/* Two Model Modes */}
      <section className="mt-10">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A5F]">Standard Mode vs. Enhanced Mode</h2>
        <p className="mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
          The system operates in two modes depending on available data:
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 p-5 bg-white">
            <h3 className="font-semibold text-[#1E3A5F]">Standard Mode (20 variables)</h3>
            <p className="mt-2 text-sm text-gray-600">
              Uses data from the <strong>current clinic visit only</strong>: HbA1c, fasting glucose,
              lipid panel, blood pressure, creatinine, ALT, hemoglobin, and documented comorbidities.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              <strong>When to use:</strong> Patient has no prior laboratory records available, or is visiting for the first time.
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 p-5 bg-blue-50">
            <h3 className="font-semibold text-[#1E3A5F]">Enhanced Mode (32 variables)</h3>
            <p className="mt-2 text-sm text-gray-600">
              Adds <strong>historical laboratory data</strong> from prior visits: previous HbA1c values,
              fasting glucose history, and HDL/hemoglobin trends over time.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              <strong>When to use:</strong> Patient has prior lab records (e.g., from 2019&ndash;2021 visits).
              Provides more accurate prediction by capturing how values have changed over time.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          The system automatically detects which mode to use based on whether historical data fields are filled in.
          Enhanced mode provides improved accuracy due to the additional trajectory information.
        </p>
      </section>

      {/* Clinical Evidence */}
      <section className="mt-10">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A5F]">Clinical Evidence</h2>
        <div className="mt-4 space-y-3 text-sm text-gray-700">
          <p>The risk levels are anchored to evidence from major diabetes prevention studies:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>The <strong>Diabetes Prevention Program (DPP)</strong>{' '}demonstrated that lifestyle intervention reduced diabetes incidence by 58% and metformin by 31%. Risk-stratified analysis showed that the highest-risk patients benefited most (NNT=3.5 for lifestyle vs. NNT&gt;20 for lowest-risk).</li>
            <li>The <strong>ADA 2025 Standards of Care</strong>{' '}recommend metformin consideration for prediabetic patients aged 25&ndash;59 with BMI &ge;35, fasting glucose &ge;110 mg/dL, or HbA1c &ge;6.0%.</li>
            <li>Saudi/Arab populations have a <strong>37% higher conversion rate</strong>{' '}compared to European populations (HR 1.37, 95% CI 1.23&ndash;1.53), supporting the need for a locally-calibrated risk tool.</li>
          </ul>
        </div>
      </section>

      {/* Development */}
      <section className="mt-10">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A5F]">Development &amp; Validation</h2>
        <p className="mt-3 text-sm text-gray-700">
          The model was developed on a retrospective cohort of Saudi prediabetic adults from Prince Sultan
          Military Medical City (PSMMC), with 2022 baseline data and 2024 follow-up outcomes. Internal
          validation was performed using stratified cross-validation and temporal validation on an
          independent patient subset.
        </p>
      </section>

      {/* Interpretation Notes */}
      <section className="mt-10">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A5F]">Interpretation Notes</h2>
        <div className="mt-4 space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            <strong>Feature contributions are displayed by clinical domain</strong>{' '}(e.g., Glycemic Control, Lipid Profile) rather than as individual features. This is because some features within a domain are correlated, and their individual coefficients are only meaningful in combination. Group-level contributions reflect each domain&apos;s risk-increasing impact.
          </p>
          <p>
            <strong>Hypothyroidism and treatment confounding:</strong>{' '}In the model&apos;s development data, diagnosed hypothyroidism appears associated with <em>lower</em>{' '}diabetes conversion rates. This likely reflects closer clinical monitoring and earlier metabolic intervention in patients under active endocrine care, rather than a biological protective effect. International literature consistently identifies hypothyroidism as a modest risk factor for type 2 diabetes (pooled RR 1.17&ndash;1.34). The model retains this variable for predictive accuracy but does not display it as a standalone factor to avoid misinterpretation.
          </p>
          <p>
            <strong>Confidence intervals</strong>{' '}are adjusted for data completeness. When fewer clinical values are provided, the confidence interval widens to reflect increased uncertainty. A &ldquo;Low&rdquo; confidence indicator means fewer than half of available features were entered.
          </p>
        </div>
      </section>

      {/* Limitations */}
      <section className="mt-10">
        <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A5F]">Known Limitations</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc pl-5 leading-relaxed">
          <li>The model was developed at a single center (PSMMC). External validation in other Saudi healthcare settings is needed.</li>
          <li>Medication data (statins, metformin, antihypertensives) was not available during model development. Some associations may reflect treatment effects rather than biological risk.</li>
          <li>NNT estimates are derived from the DPP trial (3-year lifestyle intervention, predominantly US population) and may not directly apply to a Saudi clinical context.</li>
          <li>When clinical values are missing, the model assumes the population average. Predictions are more reliable when complete laboratory panels are provided.</li>
        </ul>
      </section>
    </div>
  );
}
