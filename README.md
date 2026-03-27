# SauDRS — Saudi Prediabetes-to-Diabetes Risk Score

A browser-based clinical decision support system for estimating the individualized 2-year risk of prediabetes-to-diabetes conversion, developed specifically for Saudi Arabian healthcare settings.

Developed at **Prince Sultan Military Medical City (PSMMC)**, Ministry of Defense Health Services, Riyadh, Kingdom of Saudi Arabia.

---

## Background and Motivation

Saudi Arabia faces one of the highest diabetes prevalence rates globally, with prediabetes affecting a substantial proportion of the adult population. Arab and Middle Eastern populations have been shown to have a 37% higher prediabetes-to-diabetes conversion rate compared to European populations (HR 1.37, 95% CI 1.23–1.53), underscoring the need for population-specific risk assessment tools rather than reliance on tools developed and calibrated in Western cohorts.

SauDRS was developed to address this gap by providing a locally calibrated, evidence-based clinical prediction tool that accounts for the specific metabolic, demographic, and clinical characteristics of Saudi prediabetic patients. The system is designed to support primary care physicians, endocrinologists, and internists in making data-informed decisions about monitoring intensity, lifestyle intervention referrals, and pharmacological therapy initiation.

## What SauDRS Does

SauDRS accepts routine clinical and laboratory data collected during a standard outpatient visit and produces:

- **SauDRS Risk Score (0–100)** — A standardized composite score that maps the patient's overall risk profile onto a 0–100 scale, with 50 representing the median risk in the Saudi prediabetic population. The score determines one of 6 clinically-anchored risk tiers (Minimal through Critical), each linked to specific recommended clinical actions.

- **2-Year Conversion Probability** — A personalized probability estimate reflecting the likelihood that the patient will progress from prediabetes (HbA1c 5.7–6.4%) to diabetes (HbA1c ≥ 6.5%) within 2 years. This is the most directly actionable metric for shared decision-making with patients.

- **Annual Conversion Rate** — The estimated per-year conversion probability derived from the 2-year estimate, useful for determining appropriate monitoring frequency.

- **Number Needed to Treat (NNT)** — Based on the Diabetes Prevention Program (DPP) trial evidence, indicates how many patients at this risk level would need intensive lifestyle intervention for 3 years to prevent one additional case of diabetes.

- **Feature Contributions** — A visual breakdown showing which clinical domains (glycemic control, lipid profile, blood pressure, demographics, comorbidities, and historical trends) are contributing most to the patient's predicted risk, grouped by clinical relevance to avoid the confusion that can arise from displaying individual model coefficients.

- **Diabetes Detection Gate** — An automatic safety check that screens input values against ADA 2025 diagnostic criteria for existing diabetes. If the entered data suggests the patient may already have diabetes rather than prediabetes, the system alerts the clinician before generating a prediabetes conversion risk score.

- **Downloadable PDF Clinical Report** — A comprehensive multi-page report suitable for inclusion in the patient's medical record, containing the risk score, clinical summary, tier-specific recommended actions based on ADA 2025 guidelines and DPP evidence, key risk factors, and a complete abbreviation reference.

## Intended Users and Population

- **Users:** Licensed physicians, endocrinologists, internists, and primary care practitioners
- **Population:** Adults aged 18–100 with diagnosed prediabetes (HbA1c 5.7–6.4%) in outpatient settings
- **Context:** Risk stratification for follow-up intensity, lifestyle intervention referrals, and pharmacological therapy consideration
- **Not intended for:** Emergency settings, pediatric patients, pregnant patients, or Type 1 diabetes assessment

## Privacy and Data Security

Patient privacy is a foundational design principle of SauDRS:

- **All computation occurs entirely within the user's web browser.** The prediction model, all coefficients, and all clinical logic are embedded in the application's client-side code.
- **No patient data is ever transmitted to any server.** There are no API calls, no database connections, and no analytics tracking that involve clinical data.
- **No data is stored persistently.** Closing or refreshing the browser tab clears all entered data completely. There are no cookies, local storage entries, or cached patient information.
- **The optional patient name and MRN fields** are included solely for convenience in the downloadable PDF report. These identifiers never leave the browser and are discarded when the page is closed.
- **The application can function entirely offline** once loaded, as there are no server dependencies for any clinical computation.

## Clinical Evidence Base

The risk tiers and recommended actions in SauDRS are anchored to evidence from major diabetes prevention studies:

- The **Diabetes Prevention Program (DPP)** demonstrated that intensive lifestyle intervention reduced diabetes incidence by 58% and metformin by 31% in adults with prediabetes. Risk-stratified reanalysis showed that the highest-risk patients benefited the most (NNT = 3.5 for lifestyle), while the lowest-risk patients showed minimal benefit from metformin.

- The **ADA 2025 Standards of Care** (Section 3) recommend metformin consideration for prediabetic adults aged 25–59 with BMI ≥ 35, fasting glucose ≥ 110 mg/dL, or HbA1c ≥ 6.0%, and provide the framework for monitoring frequency and specialist referral thresholds.

- The **DPPOS 15-year follow-up** confirmed that the benefits of lifestyle intervention persist long-term, with continued reduction in diabetes incidence and improvements in cardiovascular risk factors.

## Reporting Standards and Quality Assurance

SauDRS was developed and validated in compliance with established methodological frameworks for clinical prediction models:

- **TRIPOD+AI 2024** — The Transparent Reporting of a multivariable prediction model for Individual Prognosis Or Diagnosis, updated for AI-based models. This 27-item checklist guided the reporting of model development, internal validation, and performance assessment.

- **PROBAST+AI 2025** — The Prediction model Risk Of Bias ASsessment Tool, updated for studies using both regression and machine learning methods. Self-assessment across all four domains (participants, predictors, outcome, analysis) rated the study at Low risk of bias.

- **ADA 2025** — The American Diabetes Association Standards of Care in Diabetes provided the diagnostic criteria for the diabetes detection gate and the clinical action thresholds for each risk tier.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm (included with Node.js)

### Installation

```bash
git clone https://github.com/drazzam/SauDRS.git
cd SauDRS
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application will be available immediately with full functionality.

### Building for Production

```bash
npm run build
npm start
```

The production build generates optimized static pages for all routes.

## Project Structure

```
src/
├── app/                        # Application pages
│   ├── layout.tsx              # Root layout with responsive header, navigation, and footer
│   ├── page.tsx                # Landing page with feature overview
│   ├── predict/page.tsx        # Risk calculator — the main clinical tool
│   ├── methodology/page.tsx    # Model documentation and clinical metric explanations
│   └── about/page.tsx          # Institutional information, intended use, and privacy details
├── components/                 # Reusable interface components
│   ├── ClinicalReport.tsx      # Multi-page PDF report generator
│   ├── MobileNav.tsx           # Responsive hamburger menu for mobile devices
│   ├── PDFDownloadButton.tsx   # On-demand PDF generation with lazy loading
│   ├── RiskGauge.tsx           # Semicircular SVG gauge with risk visualization
│   └── ShapChart.tsx           # Grouped feature contribution bar chart
├── lib/
│   ├── model/                  # Clinical prediction engine (pure client-side arithmetic)
│   │   ├── constants.ts        # Trained model coefficients and scaler parameters
│   │   ├── predict.ts          # Prediction pipeline and feature contribution computation
│   │   ├── scoring.ts          # Risk score mapping and 6-tier classification
│   │   ├── validate.ts         # Input validation and ADA 2025 diabetes detection gate
│   │   ├── confidenceInterval.ts # Prediction uncertainty with completeness adjustment
│   │   └── index.ts            # Module exports
│   └── types.ts                # TypeScript interface and type definitions
└── styles/
    └── globals.css             # Base styling configuration
```

## Accessibility and Responsive Design

SauDRS is designed to work across all device types:

- **Desktop** — Full three-column layout with form on the left and results panel on the right
- **Tablet** — Two-column form layout with results below
- **Mobile** — Single-column layout with hamburger navigation, full-width inputs, and touch-friendly targets (minimum 44×44 pixels per Apple Human Interface Guidelines)
- **Screen readers** — ARIA labels on navigation controls and interactive elements
- **iOS Safari** — Form inputs use 16px font size to prevent automatic zoom on focus

## Deployment

SauDRS is configured for deployment on [Vercel](https://vercel.com/) with zero additional configuration required. The `vercel.json` file includes security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy). Simply connect the GitHub repository to a Vercel project and deploy.

The application can also be deployed on any static hosting platform (Netlify, GitHub Pages, AWS S3 + CloudFront) by running `npm run build` and serving the generated output.

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request.

## Clinical Disclaimer

This clinical decision support tool has been developed to assist qualified healthcare professionals in risk stratification for prediabetes-to-diabetes conversion. All predictions must be interpreted in the context of the individual patient's complete clinical picture, including factors not captured by the model such as family history, medication adherence, dietary patterns, physical activity levels, and psychosocial considerations. This system is not intended to serve as the sole basis for clinical decision-making. The developers assume no liability for clinical decisions made using this system.

## Citation

If you use SauDRS in your research or clinical practice, please cite the associated publication (details to be updated upon publication).

## Authors

Department of Family Medicine and Primary Health Care, Prince Sultan Military Medical City, Ministry of Defense Health Services, Riyadh, Kingdom of Saudi Arabia.

## License

This project is open source and available under the [MIT License](LICENSE).
