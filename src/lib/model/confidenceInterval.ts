/**
 * Prediction Confidence Intervals — Wald CI on the logit scale
 *
 * Produces probability-dependent intervals: narrower for extreme
 * predictions, wider for uncertain middle-range predictions.
 *
 * SE is adjusted for data completeness: when fewer features are
 * provided, missing features default to population mean (z=0),
 * contributing no information. The CI widens proportionally to
 * reflect this increased uncertainty.
 */

import type { ConfidenceLevel } from '@/lib/types';

// Base SE of linear predictor from bootstrap optimism analysis
// Optimism = 0.013, CV AUC = 0.769, ~700 events
const SE_BASE = 0.45;

// Bounds to prevent degenerate CIs
const SE_FLOOR = 0.20;   // minimum SE (well-characterized patient with all features)
const SE_CEILING = 0.95;  // maximum SE (very sparse patient)

/**
 * Compute 95% confidence interval for a predicted probability.
 * Uses Wald CI on the logit scale, adjusted for data completeness.
 *
 * @param p - predicted probability
 * @param nProvided - number of features with user-provided values
 * @param nTotal - total number of features in the model
 * @param alpha - significance level (default 0.05 for 95% CI)
 */
export function waldLogitCI(
  p: number,
  nProvided: number,
  nTotal: number,
  alpha: number = 0.05,
): { interval: [number, number]; confidence: ConfidenceLevel } {
  const pClamped = Math.max(0.001, Math.min(0.999, p));
  const zCrit = alpha <= 0.05 ? 1.96 : 1.645;
  const lp = Math.log(pClamped / (1 - pClamped));

  // Inflate SE based on data completeness:
  // More missing features → wider CI (more uncertainty)
  const completeness = Math.max(nProvided, 1) / Math.max(nTotal, 1);
  let se = SE_BASE / Math.sqrt(Math.max(completeness, 0.05));

  // Clamp to reasonable bounds
  se = Math.max(SE_FLOOR, Math.min(SE_CEILING, se));

  const lpLower = lp - zCrit * se;
  const lpUpper = lp + zCrit * se;

  const pLower = 1 / (1 + Math.exp(-lpLower));
  const pUpper = 1 / (1 + Math.exp(-lpUpper));

  // Confidence level based on data completeness
  const confidence: ConfidenceLevel =
    completeness >= 0.75 ? 'high' :
    completeness >= 0.45 ? 'medium' : 'low';

  return {
    interval: [Math.max(0, pLower), Math.min(1, pUpper)],
    confidence,
  };
}
