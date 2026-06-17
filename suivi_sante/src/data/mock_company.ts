/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CompanyDatasheet, WorkingUnit, Workstation, HazardEvaluation, SafetyChemicalSheet } from "../types";

export const MOCK_COMPANY: CompanyDatasheet = {
  id: "c_seram",
  name: "SERAM INDUSTRIES",
  siret: "401 652 984 00012",
  address: "817, Boulevard Marius Berliet 66000 PERPIGNAN (Siège social) / 5, Avenue Jean Henri Bertin 66600 RIVESALTES (Etablissement secondaire)",
  contactName: "Caroline PLA",
  contactEmail: "pla.c@seram.net",
  activitySector: "Conception, Fabrication et Maintenance de Grues et Convoyeurs",
  year: 2026,
  description: "Conception, Fabrication et Maintenance de Grues et Convoyeurs. Effectif total de 69 salariés. Référente Prévention : PLA Caroline (Chargée Ressources Humaines)."
};

export const MOCK_UNITS: WorkingUnit[] = [
  {
    id: "u_bureaux",
    name: "UT 1 : LOCAUX COMMUNS - BUREAUX",
    description: "Bureaux administratifs, Ressources Humaines, Direction Générale, gestion commerciale, conception de plans techniques et d'ingénierie.",
    totalCDI: 14,
    totalCDD: 0
  },
  {
    id: "u_magasin",
    name: "UT 2 : MAGASIN",
    description: "Stockage, réception des matières premières, emballages, préparation des commandes et des kits d'ateliers.",
    totalCDI: 3,
    totalCDD: 0
  },
  {
    id: "u_montage",
    name: "UT 3 : MONTAGE / SAV",
    description: "Montage mécanique des grues, essais à blanc, dépannage client, maintenance sur site, et interventions extérieures.",
    totalCDI: 14,
    totalCDD: 0
  },
  {
    id: "u_chaudronnerie",
    name: "UT 4 : CHAUDRONNERIE / MECANOSOUDURE",
    description: "Découpe des tôles de fort tonnage, pliage, meulage complexe, soudage manuel et robotisé MAG.",
    totalCDI: 26,
    totalCDD: 0
  },
  {
    id: "u_electricite",
    name: "UT 5 : ELECTRICITE",
    description: "Câblage électrique des armoires, raccordements, tests de tension et installation des faisceaux électriques de pilotage.",
    totalCDI: 4,
    totalCDD: 0
  },
  {
    id: "u_usinage",
    name: "UT 6 : USINAGE",
    description: "Tournage, fraisage, usinage lourd des bâtis, ajustement micrométrique des arbres de transmission et des pièces maîtresses.",
    totalCDI: 3,
    totalCDD: 0
  },
  {
    id: "u_peinture",
    name: "UT 7 : PEINTURE",
    description: "Préparation des surfaces de pièces maîtresses de grue (dégraissage, sablage), application au pistolet d'apprêts anticorrosion, laques de finition et vernis de protection.",
    totalCDI: 4,
    totalCDD: 0
  },
  {
    id: "u_surveillance",
    name: "UT 8 : SURVEILLANCE DE NUIT",
    description: "Rondes de sécurité de nuit, surveillance des machines thermiques, gardiennage et sécurité globale de l'enceinte industrielle.",
    totalCDI: 1,
    totalCDD: 0
  }
];

export const MOCK_WORKSTATIONS: Workstation[] = [
  {
    id: "w_bureau",
    name: "Collaborateur de Bureau (RH/Comptabilité/Cadres)",
    unitId: "u_bureaux",
    description: "Activités de saisie informatique, appels, gestion administrative et pilotage de projets.",
    employeeCount: 14,
    demographics: { women: 8, men: 6, under18: 0, disabled: 0, nightWorker: 0 }
  },
  {
    id: "w_magasinier",
    name: "Magasinier Cariste",
    unitId: "u_magasin",
    description: "Manutention mécanique des palettes, déchargement et préparation de commandes de pièces détachées.",
    employeeCount: 3,
    demographics: { women: 1, men: 2, under18: 0, disabled: 1, nightWorker: 0 }
  },
  {
    id: "w_monteur",
    name: "Technicien de Montage / SAV",
    unitId: "u_montage",
    description: "Assemblage industriel, calage, maintenance de convoyeurs et raccordements mécaniques.",
    employeeCount: 14,
    demographics: { women: 0, men: 14, under18: 0, disabled: 0, nightWorker: 0 }
  },
  {
    id: "w_chaudronnier",
    name: "Chaudronnier Soudeur MAG",
    unitId: "u_chaudronnerie",
    description: "Débit des poutrelles en acier, soudage manuel de forte épaisseur sous flux ou gaz inerte.",
    employeeCount: 26,
    demographics: { women: 0, men: 26, under18: 0, disabled: 0, nightWorker: 0 }
  },
  {
    id: "w_electricien",
    name: "Électricien d'Atelier",
    unitId: "u_electricite",
    description: "Câblage complexe d'armoires d'engins, raccordements électriques et tests d'isolement sous basse tension.",
    employeeCount: 4,
    demographics: { women: 1, men: 3, under18: 0, disabled: 0, nightWorker: 0 }
  },
  {
    id: "w_usineur",
    name: "Opérateur Usineur (Tourneur/Fraiseur)",
    unitId: "u_usinage",
    description: "Usinage mécanique des axes rotatifs des grues, réglage des avances d'outils et manipulation de pièces.",
    employeeCount: 3,
    demographics: { women: 0, men: 3, under18: 0, disabled: 0, nightWorker: 0 }
  },
  {
    id: "w_peintre",
    name: "Peintre Applicateur Industriel",
    unitId: "u_peinture",
    description: "Application au pistolet haute pression de peintures polyuréthane anti-rouille et solvants chimiques.",
    employeeCount: 4,
    demographics: { women: 0, men: 4, under18: 0, disabled: 0, nightWorker: 0 }
  },
  {
    id: "w_veilleur",
    name: "Veilleur de Nuit",
    unitId: "u_surveillance",
    description: "Rondes extérieures régulières, vérification des accès de sécurité, et permanence préventive.",
    employeeCount: 1,
    demographics: { women: 0, men: 1, under18: 0, disabled: 0, nightWorker: 1 }
  }
];

export const MOCK_EVALUATIONS: HazardEvaluation[] = [
  // UT 1 Bureau Chutes
  {
    id: "e_bureux_chute_plain",
    unitId: "u_bureaux",
    category: "Chute de plain-pied",
    dangerSource: "Chute de plain pied suite à l'encombrement des allées de circulation.",
    gravity: 1,
    frequency: 2,
    potentialRisk: 2,
    masteryCoeff: 0.2,
    realRisk: 0.4,
    existingMeasures: ["Ménage hebdomadaire, ne rien laisser au sol.", "Éviter les attroupements.", "Passage régulier d'un prestataire de nettoyage."],
    recommendedMeasures: ["Rangement quotidien de chaque bureau par l'ensemble du personnel."],
    exposedWorkstationIds: ["w_bureau"],
    metrology: "Aucune mesure métrologique spécifique requise pour les bureaux.",
    ibe: "N/A - Aucun biomonitoring requis."
  },
  {
    id: "e_bureaux_chute_escalier",
    unitId: "u_bureaux",
    category: "Chute de hauteur",
    dangerSource: "Chute dans les escaliers lors des déplacements de bureau.",
    gravity: 2,
    frequency: 2,
    potentialRisk: 4,
    masteryCoeff: 0.4,
    realRisk: 1.6,
    existingMeasures: ["Usage préconisé de la rambarde physique.", "Ménage régulier pour éviter les glissades."],
    recommendedMeasures: ["Affichage préventif aux abords immédiats des accès d'escaliers."],
    exposedWorkstationIds: ["w_bureau"],
    metrology: "N/A (Escaliers standard conformes au Code du travail)",
    ibe: "N/A - Pas d'exposition chimique."
  },
  {
    id: "e_bureaux_écran",
    unitId: "u_bureaux",
    category: "Risque lié à l'activité physique et ergonomie",
    dangerSource: "Travail prolongé sur écran d'ordinateur.",
    gravity: 1,
    frequency: 4,
    potentialRisk: 4,
    masteryCoeff: 0.4,
    realRisk: 1.6,
    existingMeasures: ["Utilisation systématique d'écrans avec filtres anti-lumière bleue intégrés."],
    recommendedMeasures: ["Campagne d'ergonomie, ajustement des hauteurs de sièges et aménagement."],
    exposedWorkstationIds: ["w_bureau"],
    metrology: "Luminance moyenne au poste : 420 lux (Recommandation INRS : 500 lux pour la saisie).",
    ibe: "N/A - Aucun risque toxique."
  },
  {
    id: "e_bureaux_position",
    unitId: "u_bureaux",
    category: "Risque lié à l'activité physique et ergonomie",
    dangerSource: "Mauvaise position assise et postures prolongées non recommandées.",
    gravity: 1,
    frequency: 4,
    potentialRisk: 4,
    masteryCoeff: 0.4,
    realRisk: 1.6,
    existingMeasures: ["Sensibilisation informelle au travail sur écran, fourniture de sièges adaptés réglables."],
    recommendedMeasures: ["Livret d'accueil sur l'ergonomie, et intervention périodique de notre PST."],
    exposedWorkstationIds: ["w_bureau"],
    metrology: "Évaluation posturale RULA / REBA effectuée en octobre 2025.",
    ibe: "N/A"
  },

  // UT 3 MONTAGE / SAV risks
  {
    id: "e_montage_chute_plain",
    unitId: "u_montage",
    category: "Chute de plain-pied",
    dangerSource: "Chute de plain-pied suite à l'encombrement par des outillages, convoyeurs en cours de montage.",
    gravity: 2,
    frequency: 3,
    potentialRisk: 6,
    masteryCoeff: 0.4,
    realRisk: 2.4,
    existingMeasures: ["Allées dégagées périodiquement.", "Chaussures de sécurité obligatoires."],
    recommendedMeasures: ["Rangement systématique en fin de poste, traçage au sol des zones de travail."],
    exposedWorkstationIds: ["w_monteur"],
    metrology: "N/A - Risque physique environnemental.",
    ibe: "N/A"
  },
  {
    id: "e_montage_hauteur",
    unitId: "u_montage",
    category: "Chute de hauteur",
    dangerSource: "Travail en hauteur sur les structures géantes de grues lors du montage.",
    gravity: 4,
    frequency: 3,
    potentialRisk: 12,
    masteryCoeff: 0.8,
    realRisk: 9.6,
    existingMeasures: ["Harnais de sécurité disponibles.", "Formation au travail en hauteur dispensée."],
    recommendedMeasures: ["Sensibilisation renforcée, vérifications régulières des ancrages."],
    exposedWorkstationIds: ["w_monteur"],
    metrology: "Vérification annuelle réglementaire des harnais et lignes de vie (par SOCOTEC).",
    ibe: "N/A"
  },

  // UT 4 Chaudronnerie / Mécanosoudure
  {
    id: "e_chaudron_weldingconf",
    unitId: "u_chaudronnerie",
    category: "Risque chimique",
    dangerSource: "Soudage MAG, découpe au chalumeau en espace confiné (fumées toxiques).",
    gravity: 4,
    frequency: 3,
    potentialRisk: 12,
    masteryCoeff: 0.4,
    realRisk: 4.8,
    existingMeasures: ["Aspiration à la source sur torches de soudage.", "Masque ventilé individuel."],
    recommendedMeasures: ["Vérifier annuellement le débit du réseau d'extraction d'air général."],
    exposedWorkstationIds: ["w_chaudronnier"],
    metrology: "Débit d'aspiration mesuré à la torche : 120 m³/h (Conforme INRS ED 6009).",
    ibe: "Recherche de Chrome et Nickel urinaires en fin de poste en cas d'intervention sur aciers inoxydables."
  },
  {
    id: "e_chaudron_bruit",
    unitId: "u_chaudronnerie",
    category: "Bruit",
    dangerSource: "Utilisation continuelle de meuleuses d'angle et martèlement de pièces de fortes épaisseurs.",
    gravity: 3,
    frequency: 4,
    potentialRisk: 12,
    masteryCoeff: 0.8,
    realRisk: 9.6,
    existingMeasures: ["Port obligatoire des protecteurs auditifs (casques anti-bruit ou bouchons moulés)."],
    recommendedMeasures: ["Sensibilisation des opérateurs, et dosimétrie acoustique par poste réalisée par le SPST."],
    exposedWorkstationIds: ["w_chaudronnier"],
    metrology: "Dosimétrie acoustique Lex,8h : 86.8 dB(A) hors protection, atténuation théorique à 72 dB(A) avec EPI de classe 3.",
    ibe: "N/A - Examen audiométrique physique HAS obligatoire périodique (pas de bio-indicateur)."
  },

  // UT 7 Peinture
  {
    id: "e_peinture_solvants",
    unitId: "u_peinture",
    category: "Risque chimique",
    dangerSource: "Inhalation de vapeurs de solvants, toluène et xylène présents dans les laques.",
    gravity: 4,
    frequency: 4,
    potentialRisk: 16,
    masteryCoeff: 0.8,
    realRisk: 12.8,
    existingMeasures: ["Cabine fermée à aspiration, masques à cartouches A2P3 obligatoires."],
    recommendedMeasures: ["Exposition restreinte des femmes, suivi médical renforcé actif (SIR) avec examens."],
    exposedWorkstationIds: ["w_peintre"],
    metrology: "Concentration en cabine : Toluène 3.8 ppm, Xylène 11 ppm (VLEP réglementaire Toluène = 20 ppm, Xylène = 50 ppm).",
    ibe: "Dosage des métabolites urinaires : Acide méthylhippurique (pour le Xylène) en fin de poste - Valeur de référence BIOTOX INRS."
  }
];

export const MOCK_FDS: SafetyChemicalSheet[] = [
  {
    id: "fds_primer_antirouille",
    productName: "DECKCOAT PRIMAIRE ANTICORROSION EP",
    manufacturer: "GACHES CHIMIE",
    packaging: "Fût de 20L d'atelier",
    hasFds: true,
    casNumbers: ["1330-20-7 (Xylène)", "100-41-4 (Éthylbenzène)"],
    hazardPhrases: ["H226", "H312", "H315", "H332", "H351 (CMR Suspect)", "H373"],
    pictograms: ["flammable", "harmful", "cmr"],
    exposedWorkstationIds: ["w_peintre"],
    exposedUnitIds: ["u_peinture"]
  },
  {
    id: "fds_acetone_peinture",
    productName: "ACETONE LIQUIDE (DILUANT)",
    manufacturer: "GACHES CHIMIE",
    packaging: "Bidon de 5L",
    hasFds: true,
    casNumbers: ["67-64-1"],
    hazardPhrases: ["H225", "H319", "H336", "EUH066"],
    pictograms: ["flammable", "harmful"],
    exposedWorkstationIds: ["w_peintre", "w_monteur"],
    exposedUnitIds: ["u_peinture", "u_montage"]
  },
  {
    id: "fds_resine_loctite",
    productName: "LOCTITE EPOXY RESIN BLIND",
    manufacturer: "Henkel",
    packaging: "Cartouche auto-mixe",
    hasFds: true,
    casNumbers: ["25068-38-6 (Résines époxydiques)"],
    hazardPhrases: ["H315", "H319", "H317", "H360F (CMR Reprotoxique)", "H411"],
    pictograms: ["cmr", "harmful"],
    exposedWorkstationIds: ["w_chaudronnier", "w_monteur"],
    exposedUnitIds: ["u_chaudronnerie", "u_montage"]
  }
];

