/**
 * SauDRS Model Constants
 * Source: model_specification.json (LR_enhanced, 32 features)
 * These coefficients are the exact values from the trained model.
 * DO NOT MODIFY without retraining and revalidation.
 */

export const MODEL_NAME = 'SauDRS_LR_Enhanced';

// ── Enhanced model (32 features) ──────────────────────────

export const ENHANCED_FEATURES = [
  'hba1c', 'age', 'male', 'fasting_glucose', 'hdl', 'ldl',
  'total_cholesterol', 'triglyceride', 'creatinine', 'alt',
  'hemoglobin', 'systolic_bp', 'diastolic_bp', 'dx_hypertension',
  'dx_dyslipidemia', 'dx_obesity', 'dx_hypothyroidism',
  'dx_comorbidity_count', 'tg_hdl_ratio', 'non_hdl_c',
  'hist_hba1c_mean', 'hist_hba1c_max', 'hist_hba1c_variability',
  'hist_hba1c_ever_diabetic', 'hist_hba1c_slope_per_year',
  'hist_fasting_glucose_mean', 'hist_fasting_glucose_max',
  'hist_hdl_mean', 'hist_hemoglobin_mean', 'atherogenic_index',
  'tyg_index', 'hgi',
] as const;

export const ENHANCED_COEFFICIENTS: Record<string, number> = {
  hba1c: 0.2689141685642893,
  age: 0.09687853693432012,
  male: 0.02541176889107002,
  fasting_glucose: 0.33721946159903055,
  hdl: -0.17594963672803282,
  ldl: -0.4462298938640215,
  total_cholesterol: 0.11778276516049703,
  triglyceride: 0.09198423098964685,
  creatinine: -0.029569548901153923,
  alt: 0.0029482812656371525,
  hemoglobin: -0.028015364809826054,
  systolic_bp: 0.06651822280760687,
  diastolic_bp: -0.2177898118429441,
  dx_hypertension: 0.041351652065328766,
  dx_dyslipidemia: -0.00950852531452674,
  dx_obesity: 0.10012651276937039,
  dx_hypothyroidism: -0.13653521390000808,
  dx_comorbidity_count: -0.5113392335413449,
  tg_hdl_ratio: -0.1497039764337973,
  non_hdl_c: 0.19294190139103476,
  hist_hba1c_mean: 0.7312145528098979,
  hist_hba1c_max: -0.8581525890612304,
  hist_hba1c_variability: 0.3210551579801254,
  hist_hba1c_ever_diabetic: 0.1641280899557652,
  hist_hba1c_slope_per_year: 0.02830464549109339,
  hist_fasting_glucose_mean: -0.4892538161142939,
  hist_fasting_glucose_max: 0.6507244671997529,
  hist_hdl_mean: -0.13382516383476806,
  hist_hemoglobin_mean: -0.039832795634352595,
  atherogenic_index: 0.021043580048763087,
  tyg_index: -0.01112873777846257,
  hgi: 0.01860984875971975,
};

export const ENHANCED_INTERCEPT = -1.6170960256315654;

export const ENHANCED_SCALER_MEAN: number[] = [
  6.076158559938721, 54.21256223669092, 0.38605898123324395,
  5.811538886773961, 1.2391642269726193, 2.8155061668307644,
  4.873594936672616, 1.5069231151230174, 71.29221129727367,
  20.011877821429458, 13.490899048919408, 126.7142460623139,
  72.89137202496835, 0.11128318370516527, 0.051782664968065766,
  0.0146388595507204, 0.06927811452124735, 0.28035235541937953,
  1.384994674809996, 3.6344307096163986, 6.0229924711407365,
  6.244503708761556, 0.17042752313992163, 0.18731674775710283,
  -0.029456232027944833, 5.643326372790352, 5.963422874973242,
  1.2841206317210252, 13.308328710596218, 0.03489707857441427,
  8.693833472308054, 0.0008535359323023007,
];

export const ENHANCED_SCALER_SCALE: number[] = [
  0.21419124593188016, 13.059259038435204, 0.4868443737401037,
  1.9949999055859406, 0.30140169002455536, 0.8682265495608821,
  0.8059082107434842, 0.6692544105673318, 17.48884658543009,
  9.765250558906008, 1.5872569652491095, 15.180229694254685,
  10.433464806116467, 0.29095472005134226, 0.21626617724842231,
  0.1389717859687085, 0.2613551289806057, 0.5654355654874578,
  0.8704783137206001, 0.766829873346779, 0.46046378911399877,
  0.6710213404421762, 0.19963679581379654, 0.2596673299344615,
  0.5881878288553452, 0.8189604343401461, 1.2459093868997964,
  0.2601624206080439, 1.4856115057232175, 0.19951442957639628,
  0.49083523779516225, 0.13942254267880433,
];

// ── Core model (20 features — no historical data) ────────

export const CORE_FEATURES = ENHANCED_FEATURES.slice(0, 20);

export const CORE_COEFFICIENTS: Record<string, number> = {
  hba1c: 0.41059549893522057,
  age: 0.12220640982178142,
  male: 0.04692865181322436,
  fasting_glucose: 0.3133068151803994,
  hdl: -0.3037961782948158,
  ldl: -0.2019141022640572,
  total_cholesterol: -0.04948166592666286,
  triglyceride: 0.33495244862341866,
  creatinine: 0.018105543693626578,
  alt: -0.003642645125531819,
  hemoglobin: -0.08976998626036758,
  systolic_bp: 0.06840277942710575,
  diastolic_bp: -0.26799062786244937,
  dx_hypertension: 0.07828101224925843,
  dx_dyslipidemia: -0.010103783249177377,
  dx_obesity: 0.08784656376712592,
  dx_hypothyroidism: -0.13552270213877918,
  dx_comorbidity_count: -0.5314765783425961,
  tg_hdl_ratio: -0.34025455658691756,
  non_hdl_c: 0.06740347726665898,
};

export const CORE_INTERCEPT = -1.5877273723490362;

export const CORE_SCALER_MEAN = ENHANCED_SCALER_MEAN.slice(0, 20);
export const CORE_SCALER_SCALE = ENHANCED_SCALER_SCALE.slice(0, 20);

// ── SRS scoring parameters ───────────────────────────────

/** logit(0.1534) — population median on logit scale */
export const L_MEDIAN = -1.7082;
/** IQR on logit scale / 1.349 — robust scale estimate */
export const SIGMA_L = 1.2000;
/** Scaling constant: maps IQR to ~31 SRS points */
export const K_SCALE = 23.0;

// (Conformal constants removed — replaced by patient-specific Wald CI in confidenceInterval.ts)
