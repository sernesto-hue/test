/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChemicalAgent {
  name: string;
  cas: string;
  percentage: string;
  hPhrases: string[];
  pictograms: string[];
  vlep8h: number; // in mg/m³, 0 if not defined
  vlep15min: number; // in mg/m³, 0 if not defined
  unit: string; // "mg/m³" or "ppm"
  biotoxInfo: {
    indicator: string;
    samplingTime: string;
    limitValue: string;
    category: string;
  } | null;
  metropolInfo: {
    methodNumber: string;
    samplingSupport: string;
    device: string;
  } | null;
}

export interface Workstation {
  id: string;
  name: string; // e.g. "Atelier de peinture"
  jobTitle?: string; // e.g. "Peintre industriel", "Opérateur de stratification"
  situation: string; // e.g. "Application de laque au pistolet"
  chemicals: ChemicalAgent[];
  physicalStrains: {
    liftingHandled: boolean; // Triggers ISO 11228-1
    repetitiveWork: boolean; // Triggers ISO 11228-3
    pushPullHandled: boolean; // Triggers ISO 11228-2
    liftingParams?: ISO11228Params;
    repetitiveParams?: ISO11228_3Params;
  };
}

export interface ISO11228_3Params {
  technicalActionsPerMin: number; // actions/min (e.g. 10 to 80)
  forceBorgScale: number; // Borg CR10 scale index (0 to 10)
  postureScore: "optimal" | "moderate" | "severe";
  recoveryDeficitHours: number; // consecutive hours without a 10 min break
  additionalFactors: "none" | "few" | "multiple"; 
  durationHours: number; // repetitive session duration in hours
}

export interface ISO11228_3Result {
  ocraScore: number;
  riskLevel: "low" | "medium" | "high";
  riskLabel: string;
  contributions: {
    frequency: number;
    force: number;
    posture: number;
    additional: number;
  };
  multipliers: {
    recovery: number;
    duration: number;
  };
}

export interface ISO11228Params {
  actualWeight: number; // in kg
  durationHours: number; // hours per day
  verticalPosition: number; // Hand height in cm (0 to 175)
  horizontalDistance: number; // Horizontal distance in cm (25 to 63)
  verticalDistance: number; // Travel distance in cm (25 to 200)
  asymmetryAngle: number; // Twist angle in degrees (0 to 135)
  frequency: number; // Lifts per minute
  coupling: "good" | "fair" | "poor";
  genderReference: "male" | "female" | "recommended"; 
}

export interface ISO11228Result {
  recommendedWeightLimit: number; // RWL in kg
  liftingIndex: number; // LI
  riskLevel: "low" | "medium" | "high";
  multipliers: {
    hm: number; // Horizontal multiplier
    vm: number; // Vertical multiplier
    dm: number; // Distance multiplier
    am: number; // Asymmetry multiplier
    fm: number; // Frequency multiplier
    cm: number; // Coupling multiplier
  };
}

export interface BayesianSample {
  gm: number;
  gsd: number;
  p95: number;
  exceedance: number; // Probability of exceeding VLEP
}

export interface BayesianAnalysisResult {
  chemicalName: string;
  vlepLimit: number;
  unit: string;
  measuredPoints: number[];
  gmEstimate: number; // Mode or mean of GM
  gsdEstimate: number; // Mode or mean of GSD
  p95Estimate: number; // 95th percentile estimate
  exceedanceProb: number; // Prob of 95th percentile > VLEP in percentage
  riskCategory: "green" | "yellow" | "red"; // Compliant | Observation | Non-compliant
  posteriorSamples: { p95: number; gm: number; index: number }[];
}

// ─── Fiche d'Entreprise (FE) ────────────────────────────────────────────────

export type ComplianceStatus = "oui" | "non" | "à améliorer" | "à prévoir" | "à s'assurer";

// ─── Analyse comparative DUERP ───────────────────────────────────────────────

export interface DuerpUnitGap {
  unit: string;           // Nom de l'unité (ex: "Atelier de production")
  coveredItems: string[]; // Risques présents dans le DUERP analysé
  missingItems: string[]; // Risques présents dans la FE de référence mais absents du DUERP
  partialItems: string[]; // Risques évoqués mais insuffisamment détaillés
  additionalItems: string[]; // Risques supplémentaires trouvés dans le DUERP (non dans la FE)
  coveragePercent: number;
}

export interface DuerpComparisonResult {
  analyzedFileName: string;
  referenceName: string;
  globalCoverage: number;
  summary: string;
  units: DuerpUnitGap[];
}

export interface StaffEntry {
  unit: string;       // Unité fonctionnelle (ex: "Atelier de production")
  jobTitle: string;   // Fonction (ex: "Agent de production")
  men: number;
  women: number;
  cdi: number;
  cdd: number;
  total: number;
}

export interface RiskEntry {
  category: string;   // ex: "Facteurs D'ambiance", "Poussières"
  riskName: string;   // ex: "Sonore", "Gestes répétitifs"
  administrative: boolean;
  production: boolean;
  comment: string;
}

export interface ComplianceEntry {
  item: string;
  status: ComplianceStatus;
}

export interface ObservedChemical {
  name: string;
  hazardClass: string;   // ex: "CMR", "Nocif/Irritant"
  units: string[];       // ex: ["Atelier de production"]
  comment: string;
}

export interface EnterpriseSheet {
  id: string;
  visitDate: string;
  technician: string;
  doctor: string;
  company: {
    name: string;
    address: string;
    activity: string;
    nafCode: string;
    membershipId?: string;
    collectiveAgreement?: string;
  };
  staff: StaffEntry[];
  physicalRisks: RiskEntry[];
  chemicalRisks: RiskEntry[];
  infectiousRisks: RiskEntry[];
  ergonomicConstraints: RiskEntry[];
  observedChemicals: ObservedChemical[];
  collectiveProtections: ComplianceEntry[];
  individualProtections: ComplianceEntry[];
  safetyMeasures: ComplianceEntry[];
  safetyTraining: ComplianceEntry[];
  extractedWorkstations?: Workstation[]; // Postes déduits pour analyse
}

export interface HealthSurveillanceReport {
  workstationId: string;
  workstationName: string;
  situation: string;
  chemicalsAnalyzed: {
    name: string;
    cas: string;
    vlepCompliance: string;
    biotoxIndicator: string;
    metropolMethod: string;
    requiredExams: string[];
    surveillanceType: string; // e.g. "Suivi Individuel Renforcé (SIR)"
  }[];
  ergonomicAnalyzed: {
    type: string; // ISO 11228-1
    riskLevel: string;
    findings: string;
    recommendations: string[];
    requiredExams: string[];
  }[];
  globalSynthesis: string;
  generalRecommendations: string[];
  nextReviewMonths: number;
}
