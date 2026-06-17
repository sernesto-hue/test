/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core types for Occupational Health Surveillance tool

export enum MedicalSurveillanceCategory {
  SIG = "SIG", // Suivi Individuel Général (VIP standard)
  SIA = "SIA", // Suivi Individuel Adapté (Femmes enceintes, jeunes, travailleurs handicapés, travail de nuit...)
  SIR = "SIR", // Suivi Individuel Renforcé (Amiante, CMR 1A/1B, plomb, bruit > 85dB, rayonnements, etc.)
}

export interface Workstation {
  id: string;
  name: string; // e.g. "Soudeur", "Conditionneur d'expédition", "Opérateur Cabine de Vernis"
  unitId: string; // links to WorkingUnit
  description: string;
  employeeCount: number;
  demographics: {
    women: number;
    men: number;
    under18: number;
    disabled: number;
    nightWorker: number;
  };
}

export interface WorkingUnit {
  id: string;
  name: string; // e.g. "UT 1 : Bureau / Expédition", "UT 2 : Atelier de Production"
  description: string;
  totalCDI: number;
  totalCDD: number;
}

export interface CompanyDatasheet {
  id: string;
  name: string;
  siret: string;
  address: string;
  contactName: string;
  contactEmail: string;
  activitySector: string;
  year: number;
  description: string;
}

export interface HazardEvaluation {
  id: string;
  unitId: string; // Unité de Travail (UT)
  category: string; // e.g. "Risques chimiques", "Risque physique", "Bruit", "Ergonomie"
  dangerSource: string; // e.g. "Poste de perçage", "Utilisation de flux de brasage"
  gravity: number; // 1 to 4
  frequency: number; // 1 to 4
  potentialRisk: number; // gravity * frequency (1 to 16)
  masteryCoeff: number; // 0.3 (très efficace), 0.4 (efficace), 0.6 (moyennement efficace), 0.8 (insuffisant), 1.0 (inexistant)
  realRisk: number; // potentialRisk * masteryCoeff
  existingMeasures: string[];
  recommendedMeasures: string[];
  exposedWorkstationIds: string[]; // which workstations in the UT are actually exposed to this hazard
  metrology?: string; // Mesures métrologiques (ex: niveaux sonores mesurés, VLEP atmosphériques, concentrations)
  ibe?: string; // Indicateurs Biologiques d'Exposition (IBE - INRS BIOTOX) recommandés ou prescrits
}

export interface SafetyChemicalSheet {
  id: string;
  productName: string;
  manufacturer: string;
  packaging: string;
  hasFds: boolean;
  casNumbers: string[];
  hazardPhrases: string[]; // e.g., ["H350", "H360FD", "H314"]
  pictograms: string[]; // e.g., ["corrosive", "cmr", "toxic", "flammable", "harmful"]
  exposedWorkstationIds: string[];
  exposedUnitIds: string[]; // which Working Units (Secteurs) are actually exposed to this product
}

export interface DatabaseReference {
  label: string;
  url: string;
  source: "ECHA" | "PubChem" | "ACGIH" | "BIOTOX_INRS" | "LÉGIFRANCE" | "NIOSH";
  details?: string;
}

export interface MedicalReferenceRule {
  id: string;
  criteriaType: "hazard_category" | "chemical_phrase" | "demographic";
  criteriaValue: string; // e.g. "CMR", "H350", "nightWorker", "Bruit"
  matchingCategory: MedicalSurveillanceCategory;
  recommendedExams: string[]; // Complementary exams requested under HAS rules
  biologicalIndices: string[]; // Recommended Toxicological Bio-analyses (IBE) from INRS
  legalRef: string; // Code du Travail / HAS / INRS references
}

export interface WorkstationAnalysisResult {
  workstation: Workstation;
  unitName: string;
  detectedRisks: {
    hazardId?: string;
    chemicalId?: string;
    source: string; // e.g. "Bruit élevé (Atelier)", "Flux de brasage (Reprotoxique)", "Travail de nuit"
    nature: string; // e.g. "CMR", "Thermique", "Acoustique"
    score: number; // risk level score
  }[];
  surveillanceCategory: MedicalSurveillanceCategory;
  exams: string[];
  biologicalIndices: string[];
  justifications: string[];
  vigilanceAlerts?: string[];
  expertMethodologies?: string[];
  databaseReferences?: DatabaseReference[];
}
