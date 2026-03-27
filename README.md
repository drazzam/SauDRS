# SauDRS — Saudi Prediabetes-to-Diabetes Risk Score

A clinical decision support system for estimating the 2-year risk of prediabetes-to-diabetes conversion in Saudi Arabian healthcare settings.

Developed at **Prince Sultan Military Medical City (PSMMC)**, Ministry of Defense Health Services, Riyadh, Kingdom of Saudi Arabia.

---

## Overview

SauDRS provides:

- **Risk Score (0–100)** — A standardized composite score with 6 clinically-anchored risk tiers
- **2-Year Conversion Probability** — Personalized diabetes conversion risk estimate
- **Feature Contributions** — Grouped clinical domain explanations showing which factors drive risk
- **Downloadable PDF Report** — Comprehensive clinical report for patient records
- **Diabetes Detection Gate** — Screens for existing diabetes per ADA 2025 diagnostic criteria

## Key Features

- **Privacy-first**: All computation runs entirely in the browser. No patient data is transmitted to any server.
- **Evidence-based**: Model trained on 3,264 Saudi prediabetic adults with validated performance (AUC 0.806)
- **Clinically interpretable**: Risk factors displayed by clinical domain, not as opaque model coefficients
- **Mobile-responsive**: Full functionality on desktop, tablet, and smartphone devices
- **ADA 2025 compliant**: Diabetes detection gate, intervention thresholds, and clinical actions per current guidelines

## Model Performance

| Metric | Value |
|--------|-------|
| Test AUC-ROC | 0.806 |
| Cross-validated AUC | 0.769 |
| Calibration O:E Ratio | 1.026 |
| Brier Score | 0.136 |
| Optimism | 0.013 |

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 with React 19
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4
- **PDF Generation**: [@react-pdf/renderer](https://react-pdf.org/)
- **Language**: TypeScript (strict mode)
- **Deployment**: [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
git clone https://github.com/drazzam/SauDRS.git
cd SauDRS
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with header, nav, footer
│   ├── page.tsx            # Home page
│   ├── predict/page.tsx    # Risk calculator (main application)
│   ├── methodology/page.tsx # Model information & clinical guides
│   └── about/page.tsx      # About & privacy information
├── components/             # React components
│   ├── ClinicalReport.tsx  # PDF report generator
│   ├── MobileNav.tsx       # Mobile hamburger navigation
│   ├── PDFDownloadButton.tsx # Lazy-loaded PDF download
│   ├── RiskGauge.tsx       # Semicircular risk gauge visualization
│   └── ShapChart.tsx       # Grouped feature contribution chart
├── lib/
│   ├── model/              # Prediction engine (pure arithmetic)
│   │   ├── constants.ts    # Model coefficients and scaler parameters
│   │   ├── predict.ts      # Main prediction function
│   │   ├── scoring.ts      # SRS score and risk band computation
│   │   ├── validate.ts     # Input validation & diabetes gate
│   │   ├── confidenceInterval.ts # Wald CI with completeness adjustment
│   │   └── index.ts        # Barrel exports
│   └── types.ts            # TypeScript type definitions
└── styles/
    └── globals.css         # Tailwind CSS imports
```

## Clinical Disclaimer

This clinical decision support tool has been developed to assist qualified healthcare professionals in risk stratification for prediabetes-to-diabetes conversion. All predictions must be interpreted in the context of the individual patient's complete clinical picture. This system is not intended to serve as the sole basis for clinical decision-making.

## Compliance

- **TRIPOD+AI 2024** — Transparent reporting of prediction model development and validation
- **PROBAST+AI 2025** — Risk of bias self-assessment (rated Low across all domains)
- **ADA 2025** — Diagnostic criteria, intervention thresholds, and clinical action guidelines

## Authors

Department of Family Medicine and Primary Health Care, Prince Sultan Military Medical City, Ministry of Defense Health Services, Riyadh, Saudi Arabia.

## License

This project is licensed under the [MIT License](LICENSE).
