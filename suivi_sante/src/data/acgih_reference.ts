/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ACGIHChemicalRef {
  cas: string;
  name: string;
  frenchName: string;
  twa?: string;      // TWA / VME
  stel?: string;     // STEL / VLCT
  notations: string[]; // e.g. ["Skin", "A2", "BEI", "DSEN"]
  mw?: number;       // Molecular weight
  basis: string;     // Critical effect / Basis of TLV
  bei?: {
    determinant: string;
    samplingTime: string;
    value: string;
    notations: string[];
  }[];
}

export const ACGIH_2025_DATABASE: ACGIHChemicalRef[] = [
  {
    cas: "67-64-1",
    name: "Acetone",
    frenchName: "Acétone",
    twa: "250 ppm",
    stel: "500 ppm",
    notations: ["A4", "BEI"],
    mw: 58.08,
    basis: "URT & eye irr; CNS impair",
    bei: [
      {
        determinant: "Acétone urinaire",
        samplingTime: "Fin de poste",
        value: "25 mg/L",
        notations: ["Ns"]
      }
    ]
  },
  {
    cas: "79-06-1",
    name: "Acrylamide",
    frenchName: "Acrylamide",
    twa: "0.03 mg/m3 (IFV)",
    stel: "—",
    notations: ["Skin", "DSEN", "A2", "BEI"],
    mw: 71.08,
    basis: "CNS & PNS impair; cancer",
    bei: [
      {
        determinant: "S-(2-Carbamoylethyl)mercapturic acid (AAMA) dans l'urine",
        samplingTime: "Fin de poste",
        value: "800 µg/g créatinine",
        notations: ["B"]
      },
      {
        determinant: "N-(2-Carbamoylethyl)valine (CbEV) dans le sang",
        samplingTime: "Non critique (après 120j)",
        value: "500 pmol/g globine",
        notations: ["B"]
      }
    ]
  },
  {
    cas: "110-54-3",
    name: "n-Hexane",
    frenchName: "n-Hexane",
    twa: "50 ppm",
    stel: "—",
    notations: ["Skin", "BEI"],
    mw: 86.18,
    basis: "CNS impair; peripheral neuropathy; eye irr",
    bei: [
      {
        determinant: "2,5-Hexanedione dans l'urine (sans hydrolyse)",
        samplingTime: "Fin de poste",
        value: "0.5 mg/L",
        notations: ["Ns"]
      }
    ]
  },
  {
    cas: "7439-92-1",
    name: "Lead and inorganic compounds",
    frenchName: "Plomb et composés inorganiques",
    twa: "0.05 mg/m3",
    stel: "—",
    notations: ["A3", "BEI"],
    mw: 207.20,
    basis: "CNS & PNS impair; hematologic eff",
    bei: [
      {
        determinant: "Plombémie sanguine (PbB)",
        samplingTime: "Non critique",
        value: "200 µg/L (Conseil sur l'âge de procréer)",
        notations: ["B"]
      }
    ]
  },
  {
    cas: "67-56-1",
    name: "Methanol",
    frenchName: "Méthanol",
    twa: "200 ppm",
    stel: "250 ppm",
    notations: ["Skin", "BEIp"],
    mw: 32.04,
    basis: "Headache; eye dam; dizziness; nausea",
    bei: [
      {
        determinant: "Méthanol urinaire",
        samplingTime: "Fin de poste",
        value: "15 mg/L",
        notations: ["B", "Ns"]
      }
    ]
  },
  {
    cas: "71-43-2",
    name: "Benzene",
    frenchName: "Benzène",
    twa: "0.02 ppm",
    stel: "—",
    notations: ["Skin", "A1", "BEI"],
    mw: 78.11,
    basis: "Myelodysplastic syndrome; acute myeloid leukemia; hematologic eff",
    bei: [
      {
        determinant: "Acide S-Phénylmercapturique (S-PMA) urinaire",
        samplingTime: "Fin de poste",
        value: "25 µg/g créatinine",
        notations: ["B"]
      },
      {
        determinant: "Acide t,t-Muconique urinaire",
        samplingTime: "Fin de poste",
        value: "500 µg/g créatinine",
        notations: ["B"]
      }
    ]
  },
  {
    cas: "108-88-3",
    name: "Toluene",
    frenchName: "Toluène",
    twa: "20 ppm",
    stel: "—",
    notations: ["OTO", "A4", "BEI"],
    mw: 92.14,
    basis: "CNS, visual, & hearing impair; female repro system eff; pregnancy loss",
    bei: [
      {
        determinant: "Toluène sanguin",
        samplingTime: "Avant la dernière séance de travail",
        value: "0.02 mg/L",
        notations: ["B"]
      },
      {
        determinant: "Toluène urinaire",
        samplingTime: "Fin de poste",
        value: "0.03 mg/L",
        notations: ["B"]
      },
      {
        determinant: "o-Crésol urinaire",
        samplingTime: "Fin de poste",
        value: "0.3 mg/g créatinine",
        notations: ["B"]
      }
    ]
  },
  {
    cas: "75-07-0",
    name: "Acetaldehyde",
    frenchName: "Acétaldéhyde",
    twa: "—",
    stel: "C 25 ppm",
    notations: ["A2"],
    mw: 44.05,
    basis: "Eye & URT irr",
    bei: []
  },
  {
    cas: "60-35-5",
    name: "Acetamide",
    frenchName: "Acétamide",
    twa: "1 ppm (IFV)",
    stel: "—",
    notations: ["A3"],
    mw: 59.07,
    basis: "Liver cancer & dam"
  },
  {
    cas: "64-19-7",
    name: "Acetic acid",
    frenchName: "Acide acétique",
    twa: "10 ppm",
    stel: "15 ppm",
    notations: [],
    mw: 60.05,
    basis: "URT & eye irr; pulm func"
  },
  {
    cas: "108-24-7",
    name: "Acetic anhydride",
    frenchName: "Anhydride acétique",
    twa: "1 ppm",
    stel: "3 ppm",
    notations: ["A4"],
    mw: 102.09,
    basis: "Eye & URT irr"
  },
  {
    cas: "75-05-8",
    name: "Acetonitrile",
    frenchName: "Acétonitrile",
    twa: "20 ppm",
    stel: "—",
    notations: ["Skin", "A4"],
    mw: 41.05,
    basis: "LRT irr"
  },
  {
    cas: "98-86-2",
    name: "Acetophenone",
    frenchName: "Acétophénone",
    twa: "10 ppm",
    stel: "—",
    notations: [],
    mw: 120.15,
    basis: "URT irr; CNS impair; pregnancy loss"
  },
  {
    cas: "107-02-8",
    name: "Acrolein",
    frenchName: "Acroléine",
    twa: "—",
    stel: "C 0.05 ppm",
    notations: ["Skin", "A3"],
    mw: 56.06,
    basis: "Eye irr"
  },
  {
    cas: "79-10-7",
    name: "Acrylic acid",
    frenchName: "Acide acrylique",
    twa: "2 ppm",
    stel: "—",
    notations: ["Skin", "A4"],
    mw: 72.06,
    basis: "URT irr"
  },
  {
    cas: "62-53-3",
    name: "Aniline",
    frenchName: "Aniline",
    twa: "2 ppm",
    stel: "—",
    notations: ["Skin", "A3", "BEI"],
    mw: 93.13,
    basis: "MeHb-emia",
    bei: [
      {
        determinant: "Aniline urinaire d'exposition",
        samplingTime: "Fin de poste",
        value: "0.5 mg/L",
        notations: []
      }
    ]
  },
  {
    cas: "79-01-6",
    name: "Trichloroethylene",
    frenchName: "Trichloroéthylène",
    twa: "10 ppm",
    stel: "25 ppm",
    notations: ["A2", "BEI"],
    mw: 131.40,
    basis: "CNS impair; cognitive decrements; renal toxicity",
    bei: [
      {
        determinant: "Acide trichloracétique urinaire",
        samplingTime: "Fin de poste (fin de semaine)",
        value: "15 mg/L",
        notations: ["Ns"]
      },
      {
        determinant: "Trichloroéthanol libre dans le sang (sans hydrolyse)",
        samplingTime: "Fin de poste (fin de semaine)",
        value: "0.5 mg/L",
        notations: ["Ns"]
      }
    ]
  },
  {
    cas: "111-76-2",
    name: "2-Butoxyethanol",
    frenchName: "2-Butoxyéthanol (Butylglycol)",
    twa: "20 ppm",
    stel: "—",
    notations: ["A3", "BEI"],
    mw: 118.17,
    basis: "Eye & URT irr",
    bei: [
      {
        determinant: "Acide butoxyacétique (BAA) urinaire",
        samplingTime: "Fin de poste",
        value: "200 mg/g créatinine",
        notations: ["Ns"]
      }
    ]
  }
];

/**
 * Searches the ACGIH database by compound name, french name, or CAS number
 */
export function lookupACGIHExposition(query: string): ACGIHChemicalRef | undefined {
  if (!query) return undefined;
  const cleanQ = query.trim().toLowerCase();
  
  // Try exact CAS lookup first
  const casMatch = cleanQ.match(/\d+-\d+-\d+/);
  if (casMatch) {
    const casNumber = casMatch[0];
    const found = ACGIH_2025_DATABASE.find(item => item.cas === casNumber);
    if (found) return found;
  }

  // Remove CAS numbers and parentheses/special characters from query to get clean chemical name
  const cleanQueryName = cleanQ
    .replace(/\d+-\d+-\d+/, "")
    .replace(/[\(\)\:\,]/g, "")
    .trim();

  if (!cleanQueryName) return undefined;

  // Exact or very close word-boundary name match
  return ACGIH_2025_DATABASE.find(item => {
    const name = item.name.toLowerCase();
    const frName = item.frenchName.toLowerCase();
    
    // Check if clean query is exactly equal to either name
    if (cleanQueryName === name || cleanQueryName === frName) {
      return true;
    }
    
    // Or check if the name is matched as an exact word in the query
    const regexName = new RegExp(`\\b${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    const regexFrName = new RegExp(`\\b${frName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    
    // Avoid false positives like "éthylbenzène" matching "benzène"
    if (regexFrName.test(cleanQueryName) || regexName.test(cleanQueryName)) {
      // Direct word match check: Ensure "ethylbenzene" doesn't match "benzene"
      if (frName === "benzène" && cleanQueryName.includes("éthylbenzène")) {
        return false;
      }
      if (frName === "benzène" && cleanQueryName.includes("methylbenzène") || cleanQueryName.includes("méthylbenzène")) {
        return false;
      }
      if (name === "benzene" && cleanQueryName.includes("ethylbenzene")) {
        return false;
      }
      return true;
    }
    
    return false;
  });
}
