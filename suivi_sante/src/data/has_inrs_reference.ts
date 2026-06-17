/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MedicalSurveillanceCategory, MedicalReferenceRule, HazardEvaluation, SafetyChemicalSheet, DatabaseReference } from "../types";
import { lookupACGIHExposition } from "./acgih_reference";

export const HAS_INRS_RULES: MedicalReferenceRule[] = [
  // 1. CHIMIE & CMR (Cancérogènes, Mutagènes, Reprotoxiques) - LÉGIFRANCE R. 4624-23
  {
    id: "r_cmr_mutag_1",
    criteriaType: "chemical_phrase",
    criteriaValue: "H340", // Mutagène de catégorie 1A/1B (Benzène, oxyde d'éthylène...)
    matchingCategory: MedicalSurveillanceCategory.SIR,
    recommendedExams: [
      "Visite médicale d'aptitude (EMA) pré-affectation obligatoire",
      "Bilan hématologique complet de référence des lignées sanguines",
      "Évaluation cutanée attentive",
      "Information réglementaire obligatoire sur le risque génotoxique et mutagène"
    ],
    biologicalIndices: [
      "Recherche d'indices biologiques spécifiques (Biotox INRS) selon l'exposition"
    ],
    legalRef: "Article R. 4624-23 1° c) du Code du travail (Légifrance) - SIR réglementaire obligatoire pour CMR de catégories 1A et 1B."
  },
  {
    id: "r_cmr_1a_1b",
    criteriaType: "chemical_phrase",
    criteriaValue: "H350", // Cancérogène de catégorie 1A/1B (Silice, poussière de bois, benzène...)
    matchingCategory: MedicalSurveillanceCategory.SIR,
    recommendedExams: [
      "Visite médicale d'aptitude (EMA) préalable à l'affectation obligatoire",
      "Explorations Fonctionnelles Respiratoires (EFR / Spirométrie) si exposition par inhalation",
      "Examen clinique cutané détaillé et ciblé",
      "Création d'un dossier médical spécial de santé au travail (DMST) avec historique d'exposition"
    ],
    biologicalIndices: [
      "Dosages toxicologiques spécifiques INRS Biotox recommandés"
    ],
    legalRef: "Article R. 4624-23 1° c) du Code du travail (Légifrance) - SIR réglementaire obligatoire pour CMR de catégories 1A et 1B."
  },
  {
    id: "r_cmr_repro_1",
    criteriaType: "chemical_phrase",
    criteriaValue: "H360", // Toxique pour la reproduction de catégorie 1A/1B (Plomb, solvants organiques toxiques...)
    matchingCategory: MedicalSurveillanceCategory.SIR,
    recommendedExams: [
      "Visite médicale d'aptitude (EMA) pré-affectation obligatoire",
      "Bilan de santé axé sur la fonction de reproduction et évaluation clinique globale",
      "Information réglementaire obligatoire sur les risques de fertilité et d'effets fœtaux"
    ],
    biologicalIndices: [
      "Suivi biologique d'exposition (IBE) recommandé d'après le référentiel Biotox de l'INRS"
    ],
    legalRef: "Article R. 4624-23 1° c) et Article R. 4412-160 du Code du travail (Légifrance) - Classement en SIR."
  },

  // 2. CMR CATÉGORIE 2 (Suspectés CMR : H351, H341, H361, H362) - LÉGIFRANCE R. 4624-20 (Suivi Adapté SIA)
  {
    id: "r_cmr_cat2_h351",
    criteriaType: "chemical_phrase",
    criteriaValue: "H351", // Suspecté d'être cancérogène
    matchingCategory: MedicalSurveillanceCategory.SIA,
    recommendedExams: [
      "Visite d'information et de prévention adaptée réglementaire (SIA)",
      "Examen clinique cutané et respiratoire préventif",
      "Sensibilisation au port des Equipements de Protection Individuelle (EPI)"
    ],
    biologicalIndices: [],
    legalRef: "Article R. 4624-20 du Code du travail (Légifrance) - Suivi individuel adapté pour précaution sanitaire active."
  },
  {
    id: "r_cmr_cat2_h361",
    criteriaType: "chemical_phrase",
    criteriaValue: "H361", // Suspecté d'effets reprotoxiques (Ex: flux de brasage)
    matchingCategory: MedicalSurveillanceCategory.SIA,
    recommendedExams: [
      "Conseil médical individualisé sur les risques de reproduction",
      "Entretien d'orientation systématique pour les femmes en âge de procréer",
      "Aptitude à l'adaptation immédiate du poste dès la déclaration de grossesse"
    ],
    biologicalIndices: [],
    legalRef: "Article R. 4624-20 et Article R. 4152-10 du Code du travail (Légifrance) - Mesures spécifiques maternité."
  },
  {
    id: "r_solvents_voc",
    criteriaType: "chemical_phrase",
    criteriaValue: "H336", // Solvants organiques volatils / Vapeurs (Toluène, Acétone, white spirit...)
    matchingCategory: MedicalSurveillanceCategory.SIA,
    recommendedExams: [
      "Suivi d'orientation neurologique précoce (recherche de neurotoxicité chronique ou syndrome psycho-organique)",
      "Vérification de la fonction hépatique (transaminases, GGT) si exposition récurrente démontrée",
      "Contrôle de la perméabilité lipidique cutanée"
    ],
    biologicalIndices: [
      "Suivi biologique des métabolites urinaires en fin de poste (Guide INRS ED 905)"
    ],
    legalRef: "Article R. 4624-20 du Code du travail (Légifrance) - Risques chimiques ordinaires nécessitant un suivi adapté."
  },

  // 3. FACTEURS PHYSIQUES & ENVIRONNEMENTAUX
  {
    id: "r_noise_sia",
    criteriaType: "hazard_category",
    criteriaValue: "Bruit",
    matchingCategory: MedicalSurveillanceCategory.SIA,
    recommendedExams: [
      "Audiométrie tonale aérienne de dépistage (Recommandation HAS) systématique tous les 2 à 4 ans",
      "Examen otoscopique médical complet de contrôle des tympans préalable",
      "Information relative aux effets co-orthotoxiques en cas d'exposition concomitante à des solvants aromatiques"
    ],
    biologicalIndices: [],
    legalRef: "Article R. 4624-20 & Référentiel HAS/INRS (Exposition sonore supérieure ou égale aux seuils d'action R. 4431-2 du Code du travail)."
  },
  {
    id: "r_rayonnements_electro",
    criteriaType: "hazard_category",
    criteriaValue: "Rayonnements",
    matchingCategory: MedicalSurveillanceCategory.SIA,
    recommendedExams: [
      "Examen clinique complet de compatibilité absolue pour les porteurs de dispositifs médicaux implantés actifs (stimulateurs cardiaques, défibrillateurs, pompes...)",
      "Information ciblée sur les effets biologiques directs et indirects des ondes et champs électromagnétiques"
    ],
    biologicalIndices: [],
    legalRef: "Article R. 4624-20 et Décret n° 2016-1074 relatif à la protection contre les champs électromagnétiques."
  },
  {
    id: "r_vibrations",
    criteriaType: "hazard_category",
    criteriaValue: "Vibrations mécaniques",
    matchingCategory: MedicalSurveillanceCategory.SIA,
    recommendedExams: [
      "Examen clinique ostéo-articulaire précis pour la recherche de troubles musculo-squelettiques (TMS) des membres supérieurs",
      "Dépistage des troubles circulatoires réflexes (syndrome de Raynaud professionnel d'origine physique)"
    ],
    biologicalIndices: [],
    legalRef: "Article R. 4624-20 & Art. R. 4443-1 du Code du travail (Légifrance) - Exposition Vibratoire active."
  },
  {
    id: "r_screen_work",
    criteriaType: "hazard_category",
    criteriaValue: "Travail sur écran",
    matchingCategory: MedicalSurveillanceCategory.SIG,
    recommendedExams: [
      "Dépistage orienté d'asthénopie ou syndrome de fatigue visuelle (Recommandations HAS)",
      "Conseils ergonomiques personnalisés de posture physique et aménagement d'activité"
    ],
    biologicalIndices: [],
    legalRef: "Article R. 4542-17 du Code du travail (Légifrance) - Surveillance ophtalmologique spécifique liée aux écrans."
  },
  {
    id: "r_tms_handling",
    criteriaType: "hazard_category",
    criteriaValue: "Activités manuelles et ergonomie",
    matchingCategory: MedicalSurveillanceCategory.SIG,
    recommendedExams: [
      "Recherche clinique des troubles musculo-squelettiques (syndromes canalaires comme le canal carpien, tendinites ou capsulites d'effort)",
      "Examen postural du rachis en cas de port répétitif de charges supérieures à 15 kg"
    ],
    biologicalIndices: [],
    legalRef: "Fiches de surveillance clinique et d'orientation ergonomique de l'INRS (ED 950)."
  },

  // 4. PUBLICS SPÉCIFIQUES & DÉMOGRAPHIE - LÉGIFRANCE R. 4624-20 (Suivi Adapté SIA)
  {
    id: "r_night_worker",
    criteriaType: "demographic",
    criteriaValue: "nightWorker",
    matchingCategory: MedicalSurveillanceCategory.SIA,
    recommendedExams: [
      "Évaluation clinique globale à visée cardiovasculaire et métabolique (surveillance tensionnelle régulière, dépistage dyslipidémie)",
      "Évaluation de la qualité, architecture et régularité du sommeil (Échelle d'Epworth validée par l'HAS)",
      "Dépistage médico-psychologique des troubles d'humeur liés à la désynchronisation circadienne"
    ],
    biologicalIndices: [],
    legalRef: "Articles L. 3122-11 et R. 4624-20-1 du Code du travail (Légifrance) - Suivi médical périodique des travailleurs de nuit."
  },
  {
    id: "r_under_18",
    criteriaType: "demographic",
    criteriaValue: "under18",
    matchingCategory: MedicalSurveillanceCategory.SIA,
    recommendedExams: [
      "Examen médical d'aptitude (EMA) préalable réglementaire en cas d'affectation réglementée (travaux interdits dérogatoires)",
      "Vérification de la croissance osseuse et aptitude morphologique au poste"
    ],
    biologicalIndices: [],
    legalRef: "Articles R. 4153-40 du Code du travail (Légifrance) - Dispositions de protection spécifiques des jeunes travailleurs."
  },
  {
    id: "r_disabled",
    criteriaType: "demographic",
    criteriaValue: "disabled",
    matchingCategory: MedicalSurveillanceCategory.SIA,
    recommendedExams: [
      "Étude ergonomique in-situ approfondie d'adéquation et aménagement raisonnable du poste de travail",
      "Évaluation périodique de l'adaptation fonctionnelle physique ou sensorielle en concertation avec le SAMETH/Cap Emploi"
    ],
    biologicalIndices: [],
    legalRef: "Article R. 4624-20 du Code du travail (Légifrance) - Suivi individuel adapté obligatoire pour les titulaires de RQTH."
  }
];

export function determineCategoryForWorkstation(
  workstation: any,
  unitEvaluations: HazardEvaluation[],
  fdsSheets: SafetyChemicalSheet[]
): {
  category: MedicalSurveillanceCategory;
  exams: string[];
  biologicalIndices: string[];
  justifications: string[];
  vigilanceAlerts: string[];
  expertMethodologies: string[];
  databaseReferences: DatabaseReference[];
} {
  let highestCategory = MedicalSurveillanceCategory.SIG;
  const examsSet = new Set<string>();
  const bioSet = new Set<string>();
  const justifications: string[] = [];
  const vigilanceSet = new Set<string>();
  const expertMethodologies = new Set<string>();
  const databaseReferences: DatabaseReference[] = [];

  // =========================================================================
  // 1. DEMOGRAPHIC ANALYSES - LÉGIFRANCE ARTICLE R. 4624-20 & R. 4624-20-1 (SIA)
  // =========================================================================
  if (workstation.demographics.nightWorker > 0) {
    highestCategory = MedicalSurveillanceCategory.SIA;
    const rule = HAS_INRS_RULES.find((r) => r.criteriaValue === "nightWorker");
    if (rule) {
      rule.recommendedExams.forEach((e) => examsSet.add(e));
      justifications.push(`Travailleur de nuit : Suivi Individuel Adapté [SIA] codé en dur réglementairement d'après l'Article L. 3122-11 & R. 4624-20-1 du Code du travail (Légifrance).`);
    }
  }

  if (workstation.demographics.under18 > 0) {
    if (highestCategory === MedicalSurveillanceCategory.SIG) {
      highestCategory = MedicalSurveillanceCategory.SIA;
    }
    const rule = HAS_INRS_RULES.find((r) => r.criteriaValue === "under18");
    if (rule) {
      rule.recommendedExams.forEach((e) => examsSet.add(e));
      justifications.push(`Jeune travailleur mineur (-18 ans) : Suivi Individuel Adapté [SIA] codé en dur d'après l'Article R. 4153-40 du Code du travail (Légifrance) pour dérogation aux travaux interdits.`);
    }
  }

  if (workstation.demographics.disabled > 0) {
    if (highestCategory === MedicalSurveillanceCategory.SIG) {
      highestCategory = MedicalSurveillanceCategory.SIA;
    }
    const rule = HAS_INRS_RULES.find((r) => r.criteriaValue === "disabled");
    if (rule) {
      rule.recommendedExams.forEach((e) => examsSet.add(e));
      justifications.push(`Salarié titulaire de la RQTH : Suivi Individuel Adapté [SIA] codé en dur d'office selon l'Article R. 4624-20 du Code du travail (Légifrance) avec préconisations ergonomiques.`);
    }
  }

  // =========================================================================
  // 2. DISCIPLINARY HAZARDS ANALYSES (DUER / EVALUATIONS)
  // =========================================================================
  const relevantEvals = unitEvaluations.filter(
    (e) => e.unitId === workstation.unitId && (e.exposedWorkstationIds.includes(workstation.id) || e.exposedWorkstationIds.length === 0)
  );

  relevantEvals.forEach((evalItem) => {
    const catLower = evalItem.category.toLowerCase();
    const dangerLower = evalItem.dangerSource.toLowerCase();

    // A. LÉGIFRANCE : AMIANTE / ASBESTOS -> SIR (Art. R. 4624-23 1° a)
    const isAmiante = dangerLower.includes("amiante") || dangerLower.includes("asbeste");
    if (isAmiante) {
      highestCategory = MedicalSurveillanceCategory.SIR;
      examsSet.add("Auscultation pulmonaire approfondie, Questionnaire respiratoire orienté (HAS)");
      examsSet.add("Explorations Fonctionnelles Respiratoires (EFR / Spirométrie) périodiques (HAS)");
      justifications.push(`Exposition à l'Amiante : Suivi Individuel Renforcé [SIR] codé en dur obligatoire sous l'Article R. 4624-23 1° a) du Code du travail (Légifrance).`);
      expertMethodologies.add("Prélèvements et métrologie de poussières de fibres dans l'air (META - Méthode microscopique de comptage).");
      databaseReferences.push({
        label: "Article R. 4624-23 du Code du travail (Amiante SIR) - Légifrance",
        url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033709088",
        source: "LÉGIFRANCE",
        details: "Liste exhaustive des postes à risques particuliers nécessitant un suivi médical renforcé."
      });
    }

    // B. LÉGIFRANCE : PLOMB / LEAD -> SIR (Art. R. 4624-23 1° b) dans les conditions de l'Art. R. 4412-160
    const isPlomb = dangerLower.includes("plomb") || dangerLower.includes("lead");
    if (isPlomb) {
      highestCategory = MedicalSurveillanceCategory.SIR;
      examsSet.add("Examen clinique complet (recherche de troubles neurologiques, rénaux, tensionnels)");
      bioSet.add("Suivi de la plombémie sanguine obligatoire (Légifrance R. 4412-160 : Limite de 180 µg/L d'urine/sang messieurs, 80 µg/L dames)");
      justifications.push(`Absorption ou exposition au Plomb : Suivi Individuel Renforcé [SIR] codé en dur obligatoire sous l'Article R. 4624-23 1° b) dans les conditions sanitaires de l'Article R. 4412-160 du Code du travail (Légifrance).`);
      databaseReferences.push({
        label: "Plombémie de contrôle - Article R. 4412-160 - Légifrance",
        url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000018531776",
        source: "LÉGIFRANCE",
        details: "Fixation des valeurs limites biologiques obligatoires de plombémie sanguine de prévention."
      });
    }

    // C. LÉGIFRANCE : TOXINES/AGENTS BIOLOGIQUES GROUPES 3 & 4 -> SIR (Art. R. 4624-23 1° d)
    const isBiological34 = catLower.includes("infect") || catLower.includes("biolog") || dangerLower.includes("biologique") || dangerLower.includes("groupe 3") || dangerLower.includes("groupe 4");
    if (isBiological34 && (dangerLower.includes("groupe 3") || dangerLower.includes("groupe 4") || dangerLower.includes("pathogène") || dangerLower.includes("classe 3") || dangerLower.includes("classe 4"))) {
      highestCategory = MedicalSurveillanceCategory.SIR;
      examsSet.add("Contrôle serré du statut vaccinal obligatoire et couverture immunitaire active (HAS)");
      examsSet.add("Anamnèse clinique ciblée sur les pathologies bactériennes ou virales spécifiques de groupe 3 et 4");
      justifications.push(`Agents pathogènes biologiques de groupes 3 ou 4 : Suivi Individuel Renforcé [SIR] codé en dur selon l'Article R. 4624-23 1° d) et l'Article R. 4421-3 du Code du travail (Légifrance).`);
    }

    // D. LÉGIFRANCE : RAYONNEMENTS IONISANTS -> SIR (Art. R. 4624-23 1° e)
    const isIonisingRay = dangerLower.includes("ionisant") || dangerLower.includes("rayon x") || dangerLower.includes("x-ray") || dangerLower.includes("radioactif") || dangerLower.includes("radon");
    if (isIonisingRay) {
      highestCategory = MedicalSurveillanceCategory.SIR;
      examsSet.add("Numération Formule Sanguine (NFS) complète de base d'aptitude");
      examsSet.add("Dosimétrie physique périodique passive ou active centralisée sur le site de l'IRSN (Système réglementaire SISERI)");
      justifications.push(`Rayonnements ionisants (Catégories A et B) : Suivi Individuel Renforcé [SIR] codé en dur obligatoire sous l'Article R. 4624-23 1° e) du Code du travail (Légifrance).`);
      databaseReferences.push({
        label: "Rayonnements Ionisants - Code du travail R. 4624-23 - Légifrance",
        url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000018489745/",
        source: "LÉGIFRANCE",
        details: "Mesures de sécurité et suivi dosimétrique renforcé applicables aux salariés exposés aux rayonnements."
      });
    }

    // E. LÉGIFRANCE : MILIEU HYPERBARE -> SIR (Art. R. 4624-23 1° f)
    const isHyperbarie = dangerLower.includes("hyperbar") || dangerLower.includes("caisson") || dangerLower.includes("plon") || dangerLower.includes("sous-marin");
    if (isHyperbarie) {
      highestCategory = MedicalSurveillanceCategory.SIR;
      examsSet.add("Examen d'aptitude médicale hyperbare par un médecin qualifié ou certifié");
      examsSet.add("Bilan cardiovasculaire et tympanogramme ORL complet de contrôle de la trompe d'Eustache (HAS)");
      justifications.push(`Risque d'hyperbarie : Suivi Individuel Renforcé [SIR] codé en dur obligatoire d'après l'Article R. 4624-23 1° f) et l'Article R. 4461-1 du Code du travail (Légifrance).`);
    }

    // F. LÉGIFRANCE : CHUTE DE HAUTEUR SUR ÉCHAFAUDAGES -> SIR (Art. R. 4624-23 2°)
    const isScaffoldingHeight = (dangerLower.includes("échafaud") || dangerLower.includes("echafaud")) && (dangerLower.includes("montage") || dangerLower.includes("démontage") || dangerLower.includes("hauteur") || dangerLower.includes("chute"));
    if (isScaffoldingHeight) {
      highestCategory = MedicalSurveillanceCategory.SIR;
      examsSet.add("Examen d'évaluation de l'équilibre dynamique et orientation vestibulaire / absence de vertiges neurologiques (HAS)");
      examsSet.add("Bilan cardiovasculaire rigoureux et recherche de pathologies à risque coronarien ou syncopal");
      justifications.push(`Montage/Démontage d'échafaudages (Chute de hauteur de risques particuliers) : Suivi Individuel Renforcé [SIR] d'office sous l'Article R. 4624-23 2° du Code du travail (Légifrance).`);
    }

    // G. LÉGIFRANCE : POUSSIÈRES DE BOIS (DUR / BAMBOU) -> SIR (CMR Catégorie 1A sous Art. R. 4624-23 1° c)
    const isHardwoodDust = (catLower.includes("chim") || catLower.includes("pouss")) && (dangerLower.includes("bois") || dangerLower.includes("wood") || dangerLower.includes("bambou") || dangerLower.includes("cellulose") || dangerLower.includes("scie"));
    if (isHardwoodDust) {
      highestCategory = MedicalSurveillanceCategory.SIR;
      examsSet.add("Examen des fosses nasales, dépistage ciblé des cancers naso-sinusiens par avis ORL périodique (HAS)");
      examsSet.add("Bilan ventilatoire spirographique de base (EFR)");
      justifications.push(`Poussières de bois / sciure (Classé CMR Cancérogène Catégorie 1 selon l'Union Européenne) : Suivi Individuel Renforcé [SIR] obligatoire de droit sous l'Article R. 4624-23 1° c) du Code du travail (Légifrance).`);
      expertMethodologies.add("Mesurage gravimétrique sur filtre individuel avec fraction inhalable (seuil contraignant français VLEP : 1 mg/m³).");
      databaseReferences.push({
        label: "Surveillance ORL Poussières de bois - Recommandation HAS 2024",
        url: "https://www.has-sante.fr/",
        source: "BIOTOX_INRS",
        details: "Protocoles et périodicité des rhinoscopies et dépistages des adénocarcinomes naso-sinusiens."
      });
    }

    // H. LÉGIFRANCE : EXPOSITION AU BRUIT ÉLEVÉ -> SIA (Art. R. 4624-20 & Art. R. 4431-2 du Code du travail)
    const isNoiseRisk = catLower.includes("bruit") || dangerLower.includes("bruit") || dangerLower.includes("décibel") || dangerLower.includes("machinerie");
    if (isNoiseRisk && (evalItem.realRisk > 2.0 || evalItem.potentialRisk > 2.0)) {
      if (highestCategory !== MedicalSurveillanceCategory.SIR) {
        highestCategory = MedicalSurveillanceCategory.SIA;
      }
      const rule = HAS_INRS_RULES.find((r) => r.criteriaValue === "Bruit");
      if (rule) {
        rule.recommendedExams.forEach((e) => examsSet.add(e));
        justifications.push(`Exposition sonore active élevée : Suivi Individuel Adapté [SIA] codé en dur d'après l'Article R. 4624-20 et R. 4431-2 du Code du travail (Légifrance) avec audiométrie préventive périodique.`);
      }
      vigilanceSet.add(`Vigilance Bruit : Risque de surdité professionnelle (Tableau n° 42 Mal. Prof.). Pose d'EPI moulés à atténuation passive fortement recommandée.`);
    }

    // I. LÉGIFRANCE : EXPOSITION AUX CHAMPS ÉLECTROMAGNÉTIQUES OU RAYONNEMENTS NON-IONISANTS -> SIA (Décret n° 2016-1074)
    const isElectromagnetic = catLower.includes("rayon") && (dangerLower.includes("champ") || dangerLower.includes("onde") || dangerLower.includes("fréquence") || dangerLower.includes("antenne") || dangerLower.includes("induction"));
    if (isElectromagnetic) {
      if (highestCategory !== MedicalSurveillanceCategory.SIR) {
        highestCategory = MedicalSurveillanceCategory.SIA;
      }
      const rule = HAS_INRS_RULES.find((r) => r.criteriaValue === "Rayonnements");
      if (rule) {
        rule.recommendedExams.forEach((e) => examsSet.add(e));
        justifications.push(`Rayonnements non-ionisants industriels : Suivi Individuel Adapté [SIA] codé en dur selon l'Article R. 4624-20 et le Décret n° 2016-1074 contre les ondes électromagnétiques.`);
      }
    }

    // J. LÉGIFRANCE : EXPOSITION AUX VIBRATIONS PHYSIQUES -> SIA (Art. R. 4443-1)
    const isVibrations = catLower.includes("vibr") || dangerLower.includes("vibr") || dangerLower.includes("perce") || dangerLower.includes("marteau");
    if (isVibrations && (evalItem.realRisk > 2.0 || evalItem.potentialRisk > 2.0)) {
      if (highestCategory !== MedicalSurveillanceCategory.SIR) {
        highestCategory = MedicalSurveillanceCategory.SIA;
      }
      const rule = HAS_INRS_RULES.find((r) => r.criteriaValue === "Vibrations mécaniques");
      if (rule) {
        rule.recommendedExams.forEach((e) => examsSet.add(e));
        justifications.push(`Exposition vibratoire active (marteaux-piqueurs, machines tournantes) : Suivi Individuel Adapté [SIA] codé en dur selon l'Article R. 4624-20 et R. 4443-1 du Code du travail (Légifrance).`);
      }
    }

    // K. LÉGIFRANCE : n-HEXANE -> SIA (Neuropathies périphériques)
    const isHexane = catLower.includes("chim") && (dangerLower.includes("hexane") || dangerLower.includes("insolv"));
    if (isHexane) {
      if (highestCategory !== MedicalSurveillanceCategory.SIR) {
        highestCategory = MedicalSurveillanceCategory.SIA;
      }
      examsSet.add("Examen clinique neurologique précis (vigilance réflexes ostéotendineux et neuropathie périphérique)");
      bioSet.add("Dosage de la 2,5-hexanedione urinaire en fin de poste (seuil INRS VLB : 5 mg/L de 2,5-hexanedione totale ou 0,5 mg/L de 2,5-hexanedione libre)");
      justifications.push(`Exposition clinique au n-Hexane : Suivi spécifique requis d'évaluation neurologique d'après l'INRS Biotox et Légifrance.`);
    }

    // Screen and general ergonomics - standard protocol trackers.
    const isScreenWork = catLower.includes("écran") || catLower.includes("ecran") || dangerLower.includes("écran") || dangerLower.includes("ecran");
    if (isScreenWork) {
      const rule = HAS_INRS_RULES.find((r) => r.criteriaValue === "Travail sur écran");
      if (rule) {
        rule.recommendedExams.forEach((e) => examsSet.add(e));
        justifications.push(`Surveillance spécifique sur écran : Visite d'information standard de prévention (Art. R. 4542-17 du Code du travail).`);
      }
    }

    const isErgo = catLower.includes("ergo") || catLower.includes("posture") || catLower.includes("manut") || dangerLower.includes("posture") || dangerLower.includes("charge") || dangerLower.includes("colis");
    if (isErgo) {
      const rule = HAS_INRS_RULES.find((r) => r.criteriaValue === "Activités manuelles et ergonomie");
      if (rule) {
        rule.recommendedExams.forEach((e) => examsSet.add(e));
        justifications.push(`Ergonomie et TMS : Suivi préventif de l'appareil locomoteur.`);
      }
    }
  });

  // =========================================================================
  // 3. CHEMICAL SAFETY SHEETS ANALYSES (FDS / PRODUCTS)
  // =========================================================================
  const relevantFds = fdsSheets.filter((f) => {
    if (workstation.id && typeof workstation.id === "string" && workstation.id.startsWith("synth_")) {
      const realUnitId = workstation.unitId;
      return (f.exposedUnitIds && f.exposedUnitIds.includes(realUnitId)) || f.exposedWorkstationIds.length === 0;
    }
    return f.exposedWorkstationIds.includes(workstation.id) || f.exposedWorkstationIds.length === 0;
  });

  relevantFds.forEach((fdsItem) => {
    // Check for Category 1A and 1B CMR in FDS (H350, H340, H360) -> SIR obligatory (Légifrance R. 4624-23 1° c)
    const hasH350 = fdsItem.hazardPhrases.some((ph) => ph.startsWith("H350"));
    const hasH340 = fdsItem.hazardPhrases.some((ph) => ph.startsWith("H340"));
    const hasH360 = fdsItem.hazardPhrases.some((ph) => ph.startsWith("H360"));

    if (hasH350 || hasH340 || hasH360) {
      highestCategory = MedicalSurveillanceCategory.SIR;

      if (hasH350) {
        const rule = HAS_INRS_RULES.find((r) => r.criteriaValue === "H350");
        if (rule) {
          rule.recommendedExams.forEach((e) => examsSet.add(e));
          justifications.push(`Cancérogène Avéré Cat. 1A/1B [H350] (Produit: ${fdsItem.productName}) : Suivi Individuel Renforcé [SIR] codé en dur obligatoire sous l'Article R. 4624-23 1° c) et l'Article R. 4412-2 du Code du travail (Légifrance).`);
        }
      }
      if (hasH340) {
        const rule = HAS_INRS_RULES.find((r) => r.criteriaValue === "H340");
        if (rule) {
          rule.recommendedExams.forEach((e) => examsSet.add(e));
          justifications.push(`Mutagène Avéré Cat. 1A/1B [H340] (Produit: ${fdsItem.productName}) : Suivi Individuel Renforcé [SIR] codé en dur obligatoire sous l'Article R. 4624-23 1° c) et l'Article R. 4412-2 du Code du travail (Légifrance).`);
        }
      }
      if (hasH360) {
        const rule = HAS_INRS_RULES.find((r) => r.criteriaValue === "H360");
        if (rule) {
          rule.recommendedExams.forEach((e) => examsSet.add(e));
          justifications.push(`Reprotoxique Avéré Cat. 1A/1B [H360] (Produit: ${fdsItem.productName}) : Suivi Individuel Renforcé [SIR] codé en dur obligatoire sous l'Article R. 4624-23 1° c) et l'Article R. 4412-2 et R. 4412-160 du Code du travail (Légifrance).`);
        }
      }
    } else {
      // Check for Category 2 CMR in FDS (H351, H341, H361, H362) -> SIA obligatory precaution (Légifrance R. 4624-20)
      const hasH351 = fdsItem.hazardPhrases.some((ph) => ph.startsWith("H351"));
      const hasH341 = fdsItem.hazardPhrases.some((ph) => ph.startsWith("H341"));
      const hasH361 = fdsItem.hazardPhrases.some((ph) => ph.startsWith("H361"));
      const hasH362 = fdsItem.hazardPhrases.some((ph) => ph.startsWith("H362"));

      if (hasH351 || hasH341 || hasH361 || hasH362) {
        if (highestCategory !== MedicalSurveillanceCategory.SIR) {
          highestCategory = MedicalSurveillanceCategory.SIA;
        }

        let labelSet = [];
        if (hasH351) labelSet.push("H351 (Suspecté d'être cancérogène)");
        if (hasH341) labelSet.push("H341 (Suspecté d'anomalies génétiques)");
        if (hasH361) labelSet.push("H361 (Suspecté de nuire à la fertilité ou au fœtus)");
        if (hasH362) labelSet.push("H362 (Peut être nocif pour les bébés allaités)");

        const rule = HAS_INRS_RULES.find((r) => r.criteriaValue === "H361");
        if (rule) {
          rule.recommendedExams.forEach((e) => examsSet.add(e));
          justifications.push(`CMR Suspecté de Catégorie 2 (${labelSet.join(" / ")}) associé au produit chimiques [${fdsItem.productName}] : Suivi Individuel Adapté [SIA] codé en dur par mesure de prévention d'exposition d'après l'Article R. 4624-20 du Code du travail (Légifrance).`);
        }
        vigilanceSet.add(`Vigilance CMR de Catégorie 2 : ${fdsItem.productName}. Prudence accrue et substitution conseillée.`);
      }

      // Check for Organic Solvents / Volatile VOC (H336) -> SIA
      const hasH336 = fdsItem.hazardPhrases.some((ph) => ph.startsWith("H336"));
      if (hasH336) {
        if (highestCategory !== MedicalSurveillanceCategory.SIR) {
          highestCategory = MedicalSurveillanceCategory.SIA;
        }
        const rule = HAS_INRS_RULES.find((r) => r.criteriaValue === "H336");
        if (rule) {
          rule.recommendedExams.forEach((e) => examsSet.add(e));
          justifications.push(`Solvant volatile ou hydrocarbure organique agressif [H336] (Produit: ${fdsItem.productName}) : Suivi Individuel Adapté [SIA] codé en dur pour surveillance neuro-comportementale selon l'Article R. 4624-20 du Code du travail.`);
        }
        vigilanceSet.add(`Vigilance Solvant Vapeurs : ${fdsItem.productName}. Dépistage des atteintes neurologiques centrales et périphériques recommandées d'après l'INRS.`);
      }

      // Specific n-Hexane check from Safety Chemical Sheets
      const isHexaneFds = fdsItem.productName.toLowerCase().includes("hexane") || fdsItem.casNumbers.some(cas => cas.includes("110-54-3") || cas.toLowerCase().includes("hexane"));
      if (isHexaneFds) {
        if (highestCategory !== MedicalSurveillanceCategory.SIR) {
          highestCategory = MedicalSurveillanceCategory.SIA;
        }
        examsSet.add("Examen clinique neurologique ciblé sur les réflexes ostéotendineux et motricité distale");
        bioSet.add("Dosage de la 2,5-hexanedione urinaire en fin de poste (seuil INRS VLB : 5 mg/L de 2,5-hexanedione totale ou 0,5 mg/L de 2,5-hexanedione libre)");
        justifications.push(`Composé n-Hexane détecté (FDS: ${fdsItem.productName}) : Suivi Individuel Adapté [SIA] neurologique et biologique codé en dur (métabolites de neuropathies).`);
        vigilanceSet.add(`Vigilance n-Hexane : Suivi biologique indispensable du métabolite urinaire, la 2,5-hexanedione.`);
      }

      // Check for Silica (silice cristalline - H350 inside name)
      const isSilica = fdsItem.productName.toLowerCase().includes("silice") || fdsItem.productName.toLowerCase().includes("quartz") || fdsItem.productName.toLowerCase().includes("silica");
      if (isSilica) {
        highestCategory = MedicalSurveillanceCategory.SIR;
        examsSet.add("Spirométrie Fonctionnelle Respiratoire (EFR) d'effort périodique obligatoires (HAS)");
        examsSet.add("Recherche clinique précoce de toux d'effort, dyspnée et détection de pneumopathie (Silicose) par radiographie");
        justifications.push(`Silice Cristalline (Classé comme Cancérogène Avéré Catégorie 1 [H350]) : Suivi Individuel Renforcé [SIR] d'office sous l'Article R. 4624-23 1° c) du Code du travail.`);
        expertMethodologies.add("Comptage gravimétrique et diffraction de rayons X de quartz alvéolaire respirable dans l'atmosphère (seuil VLEP contraingant : 0.1 mg/m³).");
      }
    }

    // =========================================================================
    // 4. ACGIH 2025 COMPLEMENTARY TOXICOLOGICAL LOOKUP
    // =========================================================================
    const acgihMatch = lookupACGIHExposition(fdsItem.productName) || 
                       (fdsItem.casNumbers && fdsItem.casNumbers.length > 0 ? fdsItem.casNumbers.map(cn => lookupACGIHExposition(cn)).find(x => x !== undefined) : undefined);
    
    if (acgihMatch) {
      if (acgihMatch.twa && acgihMatch.twa !== "—") {
        vigilanceSet.add(`Référence ACGIH 2025 [Composé ${acgihMatch.frenchName} détecté] : Valeur limite TWA de ${acgihMatch.twa} (STEL: ${acgihMatch.stel || "N/A"}). Effet critique principal : ${acgihMatch.basis}.`);
      }
      if (acgihMatch.bei && acgihMatch.bei.length > 0) {
        acgihMatch.bei.forEach(beiItem => {
          bioSet.add(`Index IBE ACGIH 2025 [${acgihMatch.frenchName}] : ${beiItem.determinant} (${beiItem.value} - prélèvement : ${beiItem.samplingTime})`);
        });
      }
      databaseReferences.push({
        label: `Bases Réglementaires ACGIH 2025 - ${acgihMatch.frenchName}`,
        url: "https://www.acgih.org/science/tlv-bei-guidelines/",
        source: "ACGIH",
        details: `TWA : ${acgihMatch.twa || "N/A"}. Notations: ${acgihMatch.notations.join(", ")}.`
      });
    }
  });

  // =========================================================================
  // 5. REGULATORY METROLOGY & METHODOLOGISTS ADVISORIES
  // =========================================================================
  relevantEvals.forEach((evalItem) => {
    const dangerLower = evalItem.dangerSource.toLowerCase();

    if (evalItem.category === "Bruit" && evalItem.realRisk > 2.0) {
      expertMethodologies.add("Dosimétrie acoustique par carte d'exposition (Norme NF EN ISO 9612) : Évaluation par pose de dosimètres de bruit individuels actifs pour valider l'exposition Lex,8h.");
      databaseReferences.push({
        label: "Guide INRS ED 6023 (Pratique de la mesure du bruit au travail)",
        url: "https://www.inrs.fr/media.html?refINRS=ED%206023",
        source: "BIOTOX_INRS",
        details: "Méthodologie réglementaire de diagnostic acoustique."
      });
    }

    if (evalItem.category === "Rayonnements") {
      const isIonising = dangerLower.includes("ionisant") || dangerLower.includes("rayon x") || dangerLower.includes("x-ray") || dangerLower.includes("radioactif");
      if (isIonising) {
        expertMethodologies.add("Dosimétrie réglementaire passive et active (IRSN) sous l'égide du Conseiller en Radioprotection (PCR) - Suivi de la dose efficace sur 12 mois glissants.");
        databaseReferences.push({
          label: "IRSN (Surveillance dosimétrique et base SISERI)",
          url: "https://www.irsn.fr/",
          source: "LÉGIFRANCE",
          details: "Suivi réglementaire de la dose de rayonnements ionisants."
        });
      } else {
        expertMethodologies.add("Mesurage physique in-situ des champs électromagnétiques triaxiaux complexes (E/H) selon la Directive Européenne 2013/35/UE.");
        databaseReferences.push({
          label: "INRS ED 6114 (Champs électromagnétiques au travail)",
          url: "https://www.inrs.fr/media.html?refINRS=ED%206114",
          source: "BIOTOX_INRS",
          details: "Évaluation de l'exposition aux rayonnements non-ionisants industriels."
        });
      }
    }

    const isHauteurExposition = 
      (evalItem.category === "Chutes et Déplacements" || evalItem.category === "Equipements de travail" || evalItem.category === "Autre") &&
      (dangerLower.includes("hauteur") || 
       dangerLower.includes("échafaud") || 
       dangerLower.includes("echafaud") || 
       dangerLower.includes("nacelle"));

    if (isHauteurExposition) {
      expertMethodologies.add("Grille d'évaluation d'aptitude médicale pré-affectation : Élimination des contre-indications vestibulaires, neurologiques et cardiovasculaires (Recommandations HAS).");
      expertMethodologies.add("Vérification réglementaire de l'adéquation et de la conformité des garde-corps et des harnais de sécurité (Normes NF EN 363 / EN 12811).");
      databaseReferences.push({
        label: "INRS ED 6110 (Montage et utilisation d'échafaudages)",
        url: "https://www.inrs.fr/media.html?refINRS=ED%206110",
        source: "BIOTOX_INRS",
        details: "Règles de prévention lors de travaux en hauteur."
      });
    }

    if (evalItem.category === "Activités manuelles et ergonomie") {
      expertMethodologies.add("Équation de Levage NIOSH (Norme NF EN ISO 11228-1 / NF EN 1005-2) : Calcul du poids limite recommandé (RWL) et de l'indice de levage (LI) pour prévenir les pathologies rachidiennes.");
      expertMethodologies.add("Échelle ergonomique RULA / REBA (Rapid Upper Limb Assessment) pour l'évaluation de l'exposition posturale et de l'effort physique articulaire.");
      expertMethodologies.add("Tables de Snook et Ciriello : Diagnostic critique des forces admissibles pour les opérations de poussée, de traction et de transport de charges.");
      databaseReferences.push({
        label: "Fiche d'aide au repérage INRS (ED 950) - Évaluation de la manutention manuelle",
        url: "https://www.inrs.fr/media.html?refINRS=ED%20950",
        source: "NIOSH",
        details: "Directives pratiques de calcul de l'indice de levage NIOSH et grilles gestuelles associées."
      });
    }
  });

  relevantFds.forEach((fdsItem) => {
    fdsItem.casNumbers.forEach((casStr) => {
      const casMatch = casStr.match(/\d+-\d+-\d+/);
      const casClean = casMatch ? casMatch[0] : casStr.trim();
      let substanceName = casStr.split("(")[1]?.split(")")[0]?.trim() || fdsItem.productName;
      if (!substanceName && casStr.includes("Acide")) {
        substanceName = "Acide borique";
      }

      databaseReferences.push({
        label: `ECHA Substance Info - CAS ${casClean}`,
        url: `https://echa.europa.eu/fr/search-for-chemicals?_disssearchsubstance_WAR_disssearchportlet_query=${encodeURIComponent(casClean)}`,
        source: "ECHA",
        details: `Classification réglementaire harmonisée CLP et restrictions d'usage REACH pour ${substanceName}.`
      });

      databaseReferences.push({
        label: `PubChem Compound Summary - CAS ${casClean}`,
        url: `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(casClean)}`,
        source: "PubChem",
        details: `Propriétés biochimiques, seuils d'exposition et données de laboratoire pour le composé.`
      });
    });

    const hasCmr = fdsItem.hazardPhrases.some((ph) => ph.startsWith("H350") || ph.startsWith("H360") || ph.startsWith("H340") || ph.startsWith("H351") || ph.startsWith("H361") || ph.startsWith("H362"));
    const isSolvent = fdsItem.hazardPhrases.some((ph) => ph.startsWith("H336"));

    if (hasCmr || isSolvent) {
      expertMethodologies.add("Métrologie chimique de contrôle VLEP (Air ambiant par prélèvement actif sur charbon actif et désorption gazeuse GC-MS / HPLC-UV).");
      
      databaseReferences.push({
        label: `Fiche INRS BIOTOX - Biomonitoring ${fdsItem.productName}`,
        url: `https://www.inrs.fr/publications/bdd/biotox.html`,
        source: "BIOTOX_INRS",
        details: "Toxicologie et protocole de suivi biologique (dosage urinaire/sanguin de métabolites chimiques de l'INRS)."
      });

      databaseReferences.push({
        label: `ACGIH BEIs (Biological Exposure Indices) - Références Toxicologiques`,
        url: `https://www.acgih.org/science/tlv-bei-guidelines/`,
        source: "ACGIH",
        details: "Seuils biologiques d'exposition internationale recommandés par l'ACGIH."
      });
    }
  });

  // Double-check categories: make sure high-vulnerability demographics and rules match
  const hasSiaDemographic = 
    workstation.demographics.nightWorker > 0 || 
    workstation.demographics.under18 > 0 || 
    workstation.demographics.disabled > 0;

  if (highestCategory === MedicalSurveillanceCategory.SIG && hasSiaDemographic) {
    highestCategory = MedicalSurveillanceCategory.SIA;
  }

  // De-duplicate all DB references
  const uniqueDbRefs: DatabaseReference[] = [];
  const seenUrls = new Set<string>();
  databaseReferences.forEach((ref) => {
    if (!seenUrls.has(ref.url)) {
      seenUrls.add(ref.url);
      uniqueDbRefs.push(ref);
    }
  });

  // Default fallback if no special justifications
  if (justifications.length === 0) {
    justifications.push("Pas de risque réglementaire spécifique identifié : Visite d'information et de prévention sous Suivi Individuel Général standard (SIG - Article R. 4624-10 du Code du travail).");
  }

  return {
    category: highestCategory,
    exams: Array.from(examsSet),
    biologicalIndices: Array.from(bioSet),
    justifications: Array.from(new Set(justifications)),
    vigilanceAlerts: Array.from(vigilanceSet),
    expertMethodologies: Array.from(expertMethodologies),
    databaseReferences: uniqueDbRefs
  };
}
