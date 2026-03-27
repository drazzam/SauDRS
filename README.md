# SauDRS — Saudi Prediabetes-to-Diabetes Risk Score

A browser-based clinical decision support system for estimating the individualized 2-year risk of prediabetes-to-diabetes conversion, developed for Saudi Arabian healthcare settings.

Developed at **Prince Sultan Military Medical City (PSMMC)**, Riyadh, Kingdom of Saudi Arabia.

---

## Background

Saudi Arabia has one of the highest diabetes prevalence rates globally. Prediabetes affects a substantial proportion of the adult population, and Arab and Middle Eastern populations experience higher prediabetes-to-diabetes conversion rates compared to European populations. This underscores the need for population-specific risk tools rather than reliance on models developed and calibrated in other demographic contexts.

SauDRS addresses this gap by providing a locally calibrated, evidence-based clinical prediction tool that accounts for the metabolic, demographic, and clinical characteristics of the Saudi prediabetic population.

## What It Does

SauDRS accepts routine clinical and laboratory data from a standard outpatient visit and produces:

- **Risk Score (0–100)** — A standardized composite score mapping overall risk to a 0–100 scale centered on the population median. Determines one of 6 clinically-anchored risk tiers, each linked to specific recommended clinical actions.

- **2-Year Conversion Probability** — A personalized estimate of the likelihood that the patient will progress from prediabetes (HbA1c 5.7–6.4%) to diabetes (HbA1c ≥ 6.5%) within 2 years.

- **Annual Conversion Rate** — The per-year conversion probability derived from the 2-year estimate, useful for setting monitoring frequency.

- **Number Needed to Treat (NNT)** — Based on Diabetes Prevention Program trial evidence, indicating how many patients at this risk level would need lifestyle intervention to prevent one case.

- **Feature Contributions** — A visual breakdown by clinical domain (glycemic control, lipid profile, blood pressure, demographics, comorbidities) showing which factors contribute most to predicted risk.

- **Diabetes Detection Gate** — An automatic safety check screening input values against current diagnostic criteria for existing diabetes before generating a prediabetes conversion score.

- **Downloadable PDF Report** — A comprehensive clinical report for patient records, including tier-specific recommended actions, key risk factors, evidence summary, and abbreviation reference.

## Intended Use

- **Users:** Licensed physicians, endocrinologists, internists, and primary care practitioners
- **Population:** Adults aged 18–100 with prediabetes (HbA1c 5.7–6.4%) in outpatient settings
- **Context:** Risk stratification for monitoring, lifestyle intervention referrals, and pharmacological therapy consideration
- **Not intended for:** Emergency settings, pediatric patients, pregnant patients, or Type 1 diabetes

## Privacy and Data Security

- All computation runs entirely in the user's web browser
- No patient data is transmitted to any server — zero API calls, zero tracking
- No data is stored persistently — closing the browser clears everything
- Optional patient identifiers (name, MRN) exist solely for the downloadable PDF and never leave the browser
- The application functions fully offline once loaded

## Clinical Evidence Base

Risk tiers and recommended actions are anchored to evidence from major diabetes prevention studies:

- The **Diabetes Prevention Program (DPP)** demonstrated that intensive lifestyle intervention reduced diabetes incidence by 58% and metformin by 31% in adults with prediabetes
- Risk-stratified reanalysis of the DPP showed that the highest-risk patients benefit most from intervention (NNT = 3.5 for lifestyle)
- The **DPP Outcomes Study (DPPOS)** 15-year follow-up confirmed that lifestyle intervention benefits persist long-term
- Clinical action thresholds align with current clinical practice guidelines for prediabetes management

## Methodological Framework

The model was developed following established standards for clinical prediction research:

- **TRIPOD+AI** — Transparent reporting of prediction model development and validation for AI-based models
- **PROBAST+AI** — Risk of bias self-assessment across participants, predictors, outcome, and analysis domains
- Internal validation via stratified cross-validation, held-out test set, and bootstrap optimism correction

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

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Deployment

The application can be deployed on any platform that supports Node.js or static hosting:

- **Node.js hosting** — Run `npm run build` followed by `npm start` to serve the production build
- **Static hosting** — Configure the build for static export if needed, then deploy the output directory to any static hosting provider (e.g., Nginx, Apache, cloud storage with CDN)
- **Containerized** — Build a Docker image using the standard Node.js base image and serve the production build

No environment variables are required. The application is fully self-contained with zero external service dependencies.

## Project Structure

```
src/
├── app/                        # Application pages
│   ├── layout.tsx              # Root layout with responsive header, navigation, and footer
│   ├── page.tsx                # Landing page
│   ├── predict/page.tsx        # Risk calculator — the main clinical tool
│   ├── methodology/page.tsx    # Clinical documentation and metric explanations
│   └── about/page.tsx          # Institutional and privacy information
├── components/                 # Interface components
│   ├── ClinicalReport.tsx      # Multi-page PDF report generator
│   ├── MobileNav.tsx           # Responsive mobile navigation
│   ├── PDFDownloadButton.tsx   # On-demand PDF generation
│   ├── RiskGauge.tsx           # Risk visualization gauge
│   └── ShapChart.tsx           # Feature contribution chart
├── lib/
│   ├── model/                  # Prediction engine (client-side arithmetic)
│   │   ├── constants.ts        # Trained model parameters
│   │   ├── predict.ts          # Prediction pipeline
│   │   ├── scoring.ts          # Risk score and classification
│   │   ├── validate.ts         # Input validation and diabetes detection
│   │   ├── confidenceInterval.ts # Prediction uncertainty estimation
│   │   └── index.ts            # Module exports
│   └── types.ts                # Type definitions
└── styles/
    └── globals.css             # Base styling
```

## Accessibility

- Responsive layout for desktop, tablet, and smartphone
- Mobile hamburger navigation with 44×44 pixel touch targets
- ARIA labels on interactive controls
- iOS Safari zoom prevention on form inputs

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes before submitting a pull request.

## Clinical Disclaimer

This is a clinical decision support tool designed to assist qualified healthcare professionals. All predictions must be interpreted in the context of the individual patient's complete clinical picture, including factors not captured by the model. This system is not intended to serve as the sole basis for clinical decision-making.

## Citation

If you use SauDRS in your research or clinical work, please cite the associated publication (details to be updated upon publication).

## License

This project is open source under the [BSD 3-Clause License](LICENSE).

You are free to use, modify, and redistribute this software. However, per Clause 3 of the license, the names of the copyright holders and contributors may not be used to endorse or promote derived products without specific prior written permission.
