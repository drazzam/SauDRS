/**
 * SauDRS Risk Score (SRS) — 0-100 Clinical Communication Scale
 *
 * Algorithm: SRS = clamp(round(50 + K × (logit(p) - L_median) / σ_L), 0, 100)
 *
 * The SRS is a SECONDARY output for clinical communication.
 * The PRIMARY output is the calibrated probability.
 */

import type { RiskBand, RiskTier } from '@/lib/types';
import { L_MEDIAN, SIGMA_L, K_SCALE } from './constants';

/** Compute SauDRS Risk Score from calibrated probability */
export function computeSRS(p: number): number {
  // Guard against edge cases
  if (p <= 0) return 0;
  if (p >= 1) return 100;

  const L = Math.log(p / (1 - p)); // logit
  const z = (L - L_MEDIAN) / SIGMA_L;
  const raw = 50 + K_SCALE * z;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Inverse: approximate probability from SRS score */
export function srsToProb(srs: number): number {
  const z = (srs - 50) / K_SCALE;
  const L = z * SIGMA_L + L_MEDIAN;
  return 1 / (1 + Math.exp(-L));
}

/**
 * 6-tier clinical risk classification.
 *
 * Thresholds are anchored to clinical decision points:
 *   p=5%  → DPP lifestyle NNT>20, intervention not cost-effective
 *   p=10% → ADA population lower bound (5%/year)
 *   p=20% → DPP placebo arm rate; cost-weighted optimal threshold
 *   p=35% → Residual risk with lifestyle still clinically significant
 *   p=50% → DPP highest-risk quartile territory
 *
 * Band boundaries on SRS scale:
 *   p=5%  → SRS 26    (Band 1/2 boundary)
 *   p=10% → SRS 41    (Band 2/3 boundary)
 *   p=20% → SRS 56    (Band 3/4 boundary)
 *   p=35% → SRS 71    (Band 4/5 boundary)
 *   p=50% → SRS 83    (Band 5/6 boundary)
 */
export function getRiskBand(srs: number): RiskBand {
  if (srs <= 25) return BANDS[1];
  if (srs <= 40) return BANDS[2];
  if (srs <= 56) return BANDS[3];
  if (srs <= 71) return BANDS[4];
  if (srs <= 83) return BANDS[5];
  return BANDS[6];
}

const BANDS: Record<RiskTier, RiskBand> = {
  1: {
    tier: 1,
    label: 'Minimal Risk',
    color: '#22C55E',
    bgColor: '#F0FDF4',
    annualRate: '< 2.5%',
    action: 'Annual HbA1c monitoring; standard lifestyle counseling',
    nntLifestyle: '> 20',
  },
  2: {
    tier: 2,
    label: 'Low Risk',
    color: '#16A34A',
    bgColor: '#F0FDF4',
    annualRate: '2.5 – 5.1%',
    action: '6-monthly monitoring; structured lifestyle program referral',
    nntLifestyle: '10 – 20',
  },
  3: {
    tier: 3,
    label: 'Moderate Risk',
    color: '#CA8A04',
    bgColor: '#FEFCE8',
    annualRate: '5.1 – 10.6%',
    action: 'Quarterly monitoring; DPP-style intensive lifestyle; consider metformin if BMI>=35 or HbA1c>=6.0%',
    nntLifestyle: '5 – 10',
  },
  4: {
    tier: 4,
    label: 'High Risk',
    color: '#EA580C',
    bgColor: '#FFF7ED',
    annualRate: '10.6 – 19.5%',
    action: 'Bimonthly monitoring; metformin evaluation per ADA 2025 Rec 3.7; intensive lifestyle',
    nntLifestyle: '3.5 – 5',
  },
  5: {
    tier: 5,
    label: 'Very High Risk',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    annualRate: '19.5 – 29.3%',
    action: 'Monthly monitoring; metformin initiation; specialist referral; OGTT to exclude diabetes',
    nntLifestyle: '3 – 4',
  },
  6: {
    tier: 6,
    label: 'Critical Risk',
    color: '#7F1D1D',
    bgColor: '#FEF2F2',
    annualRate: '> 29.3%',
    action: 'Urgent specialist referral within 2 weeks; metformin + intensive intervention; exclude current diabetes',
    nntLifestyle: '2 – 3.5',
  },
};

export { BANDS };
