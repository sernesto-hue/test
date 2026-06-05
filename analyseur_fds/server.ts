/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 file uploads (PDFs, Images, Text)
app.use(express.json({ limit: "15mb" }));

// Pre-seeded database of common chemical substances in France (VLEP, Biotox, Metropol)
const CHEMICAL_REFERENTIAL = [
  {
    name: "Benzène",
    cas: "71-43-2",
    vlep8h: 0.66, // mg/m³ (0.2 ppm)
    vlep15min: 0, 
    unit: "mg/m³",
    biotoxInfo: {
      indicator: "Acide S-phénylmercapturique (S-PMA) urinaire",
      samplingTime: "Fin de poste / Fin de journée de travail",
      limitValue: "25 µg/g créatinine (Valeur biologique INRS)",
      category: "Cancérogène d'intérêt majeur (SMR / SIR)",
    },
    metropolInfo: {
      methodNumber: "Métropol M-221",
      samplingSupport: "Tube de charbon actif (solvant analytique CS2)",
      device: "Chromatographie en phase gazeuse (CPG-FID ou CPG-MS)",
    }
  },
  {
    name: "Toluène",
    cas: "108-88-3",
    vlep8h: 192, // mg/m³ (50 ppm)
    vlep15min: 384, // mg/m³ (100 ppm)
    unit: "mg/m³",
    biotoxInfo: {
      indicator: "Toluène urinaire ou sanguin / Acide hippurique urinaire",
      samplingTime: "Fin de poste de travail",
      limitValue: "Toluène urinaire: 0.03 mg/L | Acide hippurique: 1.6 g/g créatinine",
      category: "Dermatotoxicité, Neurotoxicité centrale",
    },
    metropolInfo: {
      methodNumber: "Métropol M-103",
      samplingSupport: "Badge passif ou tube de charbon actif",
      device: "CPG-FID par désorption",
    }
  },
  {
    name: "Styrène",
    cas: "100-42-5",
    vlep8h: 100, // mg/m³ (23 ppm)
    vlep15min: 200, // mg/m³ (46 ppm)
    unit: "mg/m³",
    biotoxInfo: {
      indicator: "Somme de l'acide mandélique et de l'acide phénylglyoxylique urinaires",
      samplingTime: "Fin de poste de travail (effet cumulatif)",
      limitValue: "600 mg/g créatinine (Recommandation INRS Biotox)",
      category: "Neurotoxique, Ototoxique (risque audition accrue)",
    },
    metropolInfo: {
      methodNumber: "Métropol M-103 / M-294",
      samplingSupport: "Charbon actif ou cartouche DNPH",
      device: "CPG ou HPLC",
    }
  },
  {
    name: "Plomb et ses composés",
    cas: "7439-92-1",
    vlep8h: 0.1, // mg/m³ (fraction alvéolaire)
    vlep15min: 0,
    unit: "mg/m³",
    biotoxInfo: {
      indicator: "Plombémie sanguine (Plomb dans le sang total)",
      samplingTime: "Examen périodique régulier (Médecin du travail)",
      limitValue: "Hommes: 200 µg/L (limite réglementaire FR) | Femmes en âge de procréer: 70 µg/L",
      category: "Répandabilité de forte toxicité (CMR reprotoxique)",
    },
    metropolInfo: {
      methodNumber: "Métropol M-003",
      samplingSupport: "Filtre ester de cellulose (fraction inhalable)",
      device: "Spectrométrie d'émission atomique (ICP-AES) ou absorption atomique",
    }
  },
  {
    name: "Silice Cristalline (Quartz)",
    cas: "14808-60-7",
    vlep8h: 0.1, // mg/m³ (quartz)
    vlep15min: 0,
    unit: "mg/m³",
    biotoxInfo: {
      indicator: "Pas de biomarqueur urinaire de routine - Suivi radiologique pulmonaire",
      samplingTime: "Suivi individuel renforcé périodique",
      limitValue: "EFR (Épreuve Fonctionnelle Respiratoire) + Scanner Thoracique HR",
      category: "Pneumoconiose grave (Silicose), Cancérogène Groupe 1",
    },
    metropolInfo: {
      methodNumber: "Métropol M-259",
      samplingSupport: "Filtre PVC avec cassette de prélèvement cyclonique",
      device: "Diffraction de rayons X (DRX) ou Spectrométrie Infrarouge (IRTF)",
    }
  },
  {
    name: "Xylène (Mélange isomères)",
    cas: "1330-20-7",
    vlep8h: 221, // mg/m³ (50 ppm)
    vlep15min: 442, // mg/m³ (100 ppm)
    unit: "mg/m³",
    biotoxInfo: {
      indicator: "Acides méthylhippuriques urinaires",
      samplingTime: "Fin de poste de travail",
      limitValue: "1.5 g/g créatinine (Indicateur biologique)",
      category: "Solvant irritant, neurotoxicité périphérique",
    },
    metropolInfo: {
      methodNumber: "Métropol M-103",
      samplingSupport: "Tube de charbon actif découpé",
      device: "CPG-FID",
    }
  },
  {
    name: "Formaldéhyde",
    cas: "50-00-0",
    vlep8h: 0.37, // mg/m³ (0.3 ppm)
    vlep15min: 0.74, // mg/m³ (0.6 ppm)
    unit: "mg/m³",
    biotoxInfo: {
      indicator: "Pas de biomarqueur urinaire d'exposition routine",
      samplingTime: "Examen clinique cutané et respiratoire",
      limitValue: "Examen médical approfondi régulier",
      category: "Cancérogène de Catégorie 1B et sensibilisant cutané",
    },
    metropolInfo: {
      methodNumber: "Métropol M-254",
      samplingSupport: "Tube imprégné de DNPH",
      device: "Chromatographie en phase liquide à haute performance (HPLC-UV)",
    }
  },
  {
    name: "Isocyanates (HDI / TDI / MDI)",
    cas: "822-06-0", // Cas HDI générique
    vlep8h: 0.075, // mg/m³ (approximate limit for France/INRS 0.01 ppm)
    vlep15min: 0.15, // mg/m³ 
    unit: "mg/m³",
    biotoxInfo: {
      indicator: "Amines urinaires correspondantes (hexaméthylènediamine, etc.)",
      samplingTime: "Fin de poste immédiate",
      limitValue: "Indicateur qualitatif d'exposition",
      category: "Fort pouvoir asthmatogène et sensibilisant respiratoire majeur",
    },
    metropolInfo: {
      methodNumber: "Métropol M-289",
      samplingSupport: "Filtre imprégné d'isopropanol-dibutylamine",
      device: "HPLC-Fluorescence ou HPLC-Spectrométrie de masse (LC-MS)",
    }
  },
  {
    name: "Amiante (Fibres)",
    cas: "1332-21-4",
    vlep8h: 0.01, // fibres/cm³ equivalent (10 fibres / litre)
    vlep15min: 0,
    unit: "f/cm³",
    biotoxInfo: {
      indicator: "Absence de biomarqueur urinaire. Évaluation clinique",
      samplingTime: "Suivi médical périodique poussé (Médecin du travail)",
      limitValue: "Scanner thoracique haute résolution régulier + EFR",
      category: "Composé hautement fibrosant et cancérogène respiratoire (Mésothéliome)",
    },
    metropolInfo: {
      methodNumber: "Métropol M-010 / Métropol HP-1",
      samplingSupport: "Filtre membrane ester de cellulose",
      device: "Microscopie Électronique à Transmission Analytique (META)",
    }
  },
  {
    name: "Acétone",
    cas: "67-64-1",
    vlep8h: 1210, // mg/m³ (500 ppm)
    vlep15min: 2420, // mg/m³ (1000 ppm)
    unit: "mg/m³",
    biotoxInfo: {
      indicator: "Acétone urinaire",
      samplingTime: "Fin de poste de travail",
      limitValue: "50 mg/L",
      category: "Solvant d'exposition courante, irritation des voies respiratoires",
    },
    metropolInfo: {
      methodNumber: "Métropol M-103",
      samplingSupport: "Prélèvement par charbon actif",
      device: "CPG-FID",
    }
  }
];

// Lazy helper to initialize Gemini API client securely
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAI) {
    const key = process.env.gemini || process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error(
        "Clé d'API GEMINI_API_KEY manquante. Veuillez la configurer dans l'onglet Settings > Secrets de l'interface Google AI Studio."
      );
    }
    genAI = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}

// Helper to call generateContent with retry and automatic fallback in case of transient errors (e.g. 503 / 429)
async function generateContentWithRetry(
  aiClient: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 3
): Promise<any> {
  let attempt = 0;
  let delay = 800;
  let currentModel = params.model;

  while (true) {
    try {
      return await aiClient.models.generateContent({
        ...params,
        model: currentModel,
      });
    } catch (error: any) {
      attempt++;
      const errorMessage = error?.message || error?.toString() || "";
      const isTransient =
        error?.status === 503 ||
        error?.status === 429 ||
        errorMessage.includes("503") ||
        errorMessage.includes("429") ||
        errorMessage.includes("UNAVAILABLE") ||
        errorMessage.includes("high demand") ||
        errorMessage.includes("overload");

      console.warn(`[Gemini API] Error on model ${currentModel} (attempt ${attempt}/${maxRetries}): status=${error?.status}, message=${errorMessage}`);

      if (isTransient && attempt < maxRetries) {
        // If we've hit a transient error on gemini-3.5-flash twice, transition immediately
        // to highly available gemini-3.1-flash-lite to minimize latency.
        if (currentModel === "gemini-3.5-flash" && attempt >= 2) {
          console.warn(`[Gemini API] Transitioning early to fallback model 'gemini-3.1-flash-lite' due to capacity constraints on ${currentModel}.`);
          currentModel = "gemini-3.1-flash-lite";
          attempt = 0; // Reset attempts for the retry on the lite model
          delay = 500;
          continue;
        }

        console.warn(`[Gemini API] Retrying ${currentModel} in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5;
        continue;
      }

      // If we exhausted all original retries and we're still on gemini-3.5-flash, try falling back to gemini-3.1-flash-lite
      if (currentModel === "gemini-3.5-flash") {
        console.warn(`[Gemini API] Exhausted retries on 'gemini-3.5-flash'. Attempting final fallback with 'gemini-3.1-flash-lite'...`);
        try {
          return await aiClient.models.generateContent({
            ...params,
            model: "gemini-3.1-flash-lite",
          });
        } catch (fallbackError: any) {
          console.error("[Gemini API] Fallback to 'gemini-3.1-flash-lite' failed:", fallbackError);
          throw fallbackError;
        }
      }

      throw error;
    }
  }
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Basic status check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    referentialSize: CHEMICAL_REFERENTIAL.length,
    hasApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  });
});

// Get reference chemical list
app.get("/api/referential", (req, res) => {
  res.json(CHEMICAL_REFERENTIAL);
});

// LLM Analysis of SDS / Document Unique
app.post("/api/analyze-documents", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { text, fileData, fileName, fileMimeType } = req.body;

    if (!text && !fileData) {
      res.status(400).json({ error: "Aucun document ou texte fourni." });
      return;
    }

    const aiClient = getGeminiClient();

    let contentInput: any[] = [];

    // If the file is uploaded as base64 and it's an image or document, include the part
    if (fileData && fileMimeType) {
      contentInput.push({
        inlineData: {
          data: fileData,
          mimeType: fileMimeType,
        }
      });
    }

    // Direct text instructions / raw text input
    let promptText = `
Vous êtes un ingénieur expert en hygiène industrielle, toxicologie et prévention des risques professionnels (médecine du travail en France).
Votre mission est d'analyser le texte ou le document d'une Fiche de Données de Sécurité (FDS) et de le confronter éventuellement avec des éléments d'un "Document Unique d'Évaluation des Risques" (DUERP) s'ils sont présents dans les données fournies.

Voici les données textuelles fournies :
--- DÉBUT DES DONNÉES DOCUMENTAIRES ---
${text || "(Document fourni en pièce jointe d'analyses multimodales)"}
${fileName ? `Nom du fichier : ${fileName}` : ""}
--- FIN DES DONNÉES DOCUMENTAIRES ---

Consignes d'extraction obligatoires :
1. Postes ou Situations de Travail : Identifiez les situations ou postes de travail cités dans le Document Unique ou déduisez logiquement les postes concernés si c'est une Fiche de Données de Sécurité pure. Pour chaque poste, précisez le titre de poste ou la qualification professionnelle (ex: "Peintre industriel", "Opérateur de stratification", "Mécanicien automobile", "Technicien de laboratoire").
2. Agents Chimiques Présents : Extrayez les substances dangereuses (Nom, Numéro CAS, Pourcentage approximatif ou concentration, Phrases H de danger ex: H350, H340, H315, H373, pictogrammes pertinents).
3. Pour chaque poste identifié, déterminez si :
   - Des charges lourdes sont manipulées, levées ou portées (ce qui déclencherait l'application de la norme ergonomique ISO 11228-1). Si c'est le cas, proposez des valeurs de masse par défaut réalistes de charges soulevées (ex: 15 kg ou 20 kg).
   - Du travail répétitif à haute fréquence est présent (déclenchant la norme ISO 11228-3).
4. Pour chaque substance, associez les valeurs limites françaises de l'INRS (VLEP-8h et VLCT-15min) et suggérez les examens complémentaires obligatoires de surveillance médicale selon l'INRS BIOTOX et METROPOL (biométrologie urinaire ou sanguine).

Vous DEVEZ répondre STRICTEMENT sous la forme d'un objet JSON respectant le format TypeScript suivant :
{
  "workstations": [
    {
      "id": "un_id_court_unique",
      "name": "Nom du poste de travail ou de l'atelier",
      "jobTitle": "Titre du poste / qualification (ex: Peintre industriel, Sableur, Opérateur de ligne)",
      "situation": "Description détaillée de la situation d'exposition de travail",
      "chemicals": [
        {
          "name": "Nom chimique exact",
          "cas": "Numéro CAS",
          "percentage": "Pourcentage ou plage (ex: 5-10%)",
          "hPhrases": ["H...", "H..."],
          "pictograms": ["GHS02", "GHS07", "GHS08"], // codes pictogrammes standard
          "vlep8h": 0.0, // valeur en mg/m³ ou ppm si trouvé, sinon mettre 0.0
          "vlep15min": 0.0, // ou 0.0
          "unit": "mg/m³ ou ppm",
          "biotoxInfo": {
            "indicator": "Nom du bio-indicateur à doser",
            "samplingTime": "Moment du prélèvement (ex: Fin de poste)",
            "limitValue": "Valeur limite biologique (ex: x µg/g créatinine)",
            "category": "Classification / Commentaires"
          },
          "metropolInfo": {
            "methodNumber": "Référence de la méthode Métropol ex: M-103",
            "samplingSupport": "Support de prélèvement recommandé",
            "device": "Technique analytique recommandée"
          }
        }
      ],
      "physicalStrains": {
        "liftingHandled": true_ou_false,
        "repetitiveWork": true_ou_false,
        "pushPullHandled": true_ou_false,
        "liftingParams": { // Si liftingHandled est true, proposez des paramètres par défaut plausibles pour ce poste
          "actualWeight": 15,
          "durationHours": 4,
          "verticalPosition": 75,
          "horizontalDistance": 30,
          "verticalDistance": 50,
          "asymmetryAngle": 0,
          "frequency": 2,
          "coupling": "good",
          "genderReference": "recommended"
        }
      }
    }
  ]
}

N'ajoutez aucune phrase d'explications supplémentaires en dehors du bloc JSON valide. Si des substances ou des postes ont des correspondances directes avec les grands fondamentaux de la prévention (Benzène, Plomb, Styrène, Silice, Toluène, Xylène), utilisez les valeurs limites biologiques et professionnelles réelles pour enrichir au maximum votre réponse.
`;

    contentInput.push({ text: promptText });

    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.5-flash",
      contents: contentInput,
      config: {
        responseMimeType: "application/json",
      },
    });

    let resultJson = response.text || "{}";
    
    // Clean up response if it has been backticked as markdown json
    if (resultJson.startsWith("```json")) {
      resultJson = resultJson.substring(7);
    }
    if (resultJson.endsWith("```")) {
      resultJson = resultJson.substring(0, resultJson.length - 3);
    }
    
    const parsedData = JSON.parse(resultJson.trim());

    // Post-process the extracted data: cross-reference with our highly reliable CHEMICAL_REFERENTIAL
    // to fill in any gaps left by the LLM (like exact BIOTOX recommendations, METROPOL references)
    if (parsedData && Array.isArray(parsedData.workstations)) {
      for (const wk of parsedData.workstations) {
        if (Array.isArray(wk.chemicals)) {
          wk.chemicals = wk.chemicals.map((chem: any) => {
            const refChem = CHEMICAL_REFERENTIAL.find(
              c => c.cas === chem.cas || c.name.toLowerCase() === chem.name.toLowerCase()
            );
            if (refChem) {
              return {
                ...chem,
                vlep8h: chem.vlep8h || refChem.vlep8h,
                vlep15min: chem.vlep15min || refChem.vlep15min,
                unit: chem.unit || refChem.unit,
                biotoxInfo: chem.biotoxInfo || refChem.biotoxInfo,
                metropolInfo: chem.metropolInfo || refChem.metropolInfo
              };
            }
            return chem;
          });
        }
      }
    }

    res.json(parsedData);

  } catch (error: any) {
    console.error("Error analyzing document via Gemini:", error);
    res.status(500).json({
      error: error.message || "Erreur interne lors de la communication avec l'assistant IA."
    });
  }
});

// ─── Analyse Fiche d'Entreprise (FE) ─────────────────────────────────────────
app.post("/api/analyze-enterprise-sheet", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { text, fileData, fileName, fileMimeType } = req.body;

    if (!text && !fileData) {
      res.status(400).json({ error: "Aucun document ou texte fourni." });
      return;
    }

    const aiClient = getGeminiClient();
    let contentInput: any[] = [];

    if (fileData && fileMimeType) {
      contentInput.push({ inlineData: { data: fileData, mimeType: fileMimeType } });
    }

    const promptText = `
Vous êtes un expert en santé au travail et en prévention des risques professionnels (médecine du travail, France).
Analysez le document suivant qui est une FICHE D'ENTREPRISE (FE) — document rédigé par un technicien hygiène-sécurité ou un médecin du travail lors d'une visite d'établissement.

--- DÉBUT DU DOCUMENT ---
${text || "(Document en pièce jointe)"}
${fileName ? `Fichier : ${fileName}` : ""}
--- FIN DU DOCUMENT ---

Extrayez TOUTES les informations disponibles et structurez-les en JSON strict selon ce format :

{
  "id": "fe_[entreprise_courte]_[année]",
  "visitDate": "date de visite (ex: 2019-10-03)",
  "technician": "Nom du technicien/préventeur ayant rédigé la fiche",
  "doctor": "Nom du médecin du travail responsable",
  "company": {
    "name": "Nom légal de l'entreprise",
    "address": "Adresse complète",
    "activity": "Description de l'activité principale",
    "nafCode": "Code NAF",
    "membershipId": "N° d'adhésion au service de santé au travail",
    "collectiveAgreement": "Convention collective applicable"
  },
  "staff": [
    {
      "unit": "Unité fonctionnelle",
      "jobTitle": "Fonction ou qualification",
      "men": 0,
      "women": 0,
      "cdi": 0,
      "cdd": 0,
      "total": 0
    }
  ],
  "physicalRisks": [
    {
      "category": "Catégorie (ex: Facteurs D'ambiance, Poussières...)",
      "riskName": "Nom du risque (ex: Sonore, Thermique...)",
      "administrative": true,
      "production": true,
      "comment": "Commentaire issu du document"
    }
  ],
  "chemicalRisks": [
    {
      "category": "Risques Chimiques",
      "riskName": "Type (ex: CMR, Nocif/Irritant...)",
      "administrative": false,
      "production": true,
      "comment": "Produits observés et commentaires"
    }
  ],
  "infectiousRisks": [],
  "ergonomicConstraints": [
    {
      "category": "Posture / Manutention / Gestes répétitifs",
      "riskName": "Nom précis (ex: Gestes répétitifs forcés, Charges portées manuellement...)",
      "administrative": false,
      "production": true,
      "comment": "Tâches et commentaires détaillés"
    }
  ],
  "observedChemicals": [
    {
      "name": "Nom du produit chimique observé",
      "hazardClass": "Classification (ex: CMR Catégorie 1, Reprotoxique Cat 3, Nocif/Irritant)",
      "units": ["Unités concernées"],
      "comment": "Contexte d'utilisation"
    }
  ],
  "collectiveProtections": [
    { "item": "Description de la mesure", "status": "oui" }
  ],
  "individualProtections": [
    { "item": "EPI (ex: Casque anti-bruit)", "status": "oui" }
  ],
  "safetyMeasures": [
    { "item": "Mesure de sécurité", "status": "oui" }
  ],
  "safetyTraining": [
    { "item": "Formation (ex: Formation au Risque Chimique)", "status": "non" }
  ],
  "extractedWorkstations": [
    {
      "id": "ws_[court]",
      "name": "Nom de l'atelier ou du poste (ex: Atelier de production)",
      "jobTitle": "Qualification principale (ex: Agent de production, Chef d'équipe)",
      "situation": "Description complète de la situation d'exposition et des tâches",
      "chemicals": [
        {
          "name": "Nom chimique (ex: Isocyanates - Colle KLEIBERIT)",
          "cas": "Numéro CAS si connu, sinon vide",
          "percentage": "Concentration ou usage observé",
          "hPhrases": ["H-phrases si connues"],
          "pictograms": ["GHS"],
          "vlep8h": 0,
          "vlep15min": 0,
          "unit": "mg/m³",
          "biotoxInfo": null,
          "metropolInfo": null
        }
      ],
      "physicalStrains": {
        "liftingHandled": true,
        "repetitiveWork": true,
        "pushPullHandled": false,
        "liftingParams": {
          "actualWeight": 20,
          "durationHours": 4,
          "verticalPosition": 75,
          "horizontalDistance": 35,
          "verticalDistance": 50,
          "asymmetryAngle": 0,
          "frequency": 2,
          "coupling": "fair",
          "genderReference": "recommended"
        },
        "repetitiveParams": {
          "technicalActionsPerMin": 35,
          "forceBorgScale": 3,
          "postureScore": "moderate",
          "recoveryDeficitHours": 2,
          "additionalFactors": "few",
          "durationHours": 5
        }
      }
    }
  ]
}

Pour les statuts de conformité, utilisez exclusivement : "oui", "non", "à améliorer", "à prévoir", "à s'assurer".
Ne renvoyez que le JSON valide, sans texte autour.
`;

    contentInput.push({ text: promptText });

    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.5-flash",
      contents: contentInput,
      config: { responseMimeType: "application/json" },
    });

    let resultJson = response.text || "{}";
    if (resultJson.startsWith("```json")) resultJson = resultJson.substring(7);
    if (resultJson.endsWith("```")) resultJson = resultJson.substring(0, resultJson.length - 3);

    const parsed = JSON.parse(resultJson.trim());

    // Cross-reference extracted chemicals with CHEMICAL_REFERENTIAL
    if (parsed.extractedWorkstations) {
      for (const wk of parsed.extractedWorkstations) {
        if (Array.isArray(wk.chemicals)) {
          wk.chemicals = wk.chemicals.map((chem: any) => {
            const ref = CHEMICAL_REFERENTIAL.find(
              c => c.cas === chem.cas || c.name.toLowerCase() === chem.name.toLowerCase()
            );
            if (ref) {
              return {
                ...chem,
                vlep8h: chem.vlep8h || ref.vlep8h,
                vlep15min: chem.vlep15min || ref.vlep15min,
                unit: chem.unit || ref.unit,
                biotoxInfo: chem.biotoxInfo || ref.biotoxInfo,
                metropolInfo: chem.metropolInfo || ref.metropolInfo,
              };
            }
            return chem;
          });
        }
      }
    }

    res.json(parsed);
  } catch (error: any) {
    console.error("Error analyzing enterprise sheet:", error);
    res.status(500).json({ error: error.message || "Erreur lors de l'analyse de la Fiche d'Entreprise." });
  }
});

// Generate dynamic Health Report Summary using AI for smart text drafting
app.post("/api/generate-health-report", async (req: express.Request, res: express.Response) => {
  try {
    const { workstation, baysianRuns, isoResults } = req.body;

    const aiClient = getGeminiClient();

    const promptText = `
Vous êtes le médecin du travail et l'expert HSE encadrant l'activité suivante :
Poste : ${workstation.name} (${workstation.situation})

Nous avons mené des simulations approfondies :
1. Analyse Bayésienne d'exposition chimique :
${JSON.stringify(baysianRuns, null, 2)}

2. Évaluation Ergonomique ISO 11228-1 :
${JSON.stringify(isoResults, null, 2)}

Pour le rapport de surveillance de la santé et les examens complémentaires obligatoires, veuillez rédiger :
- Une synthèse globale du niveau de risque et de la robustesse statistique (mentionner l'approche bayésienne d'expositions pour justifier la surveillance et la conformité).
- Des recommandations générales spécifiques de prévention technique, collective et individuelle (ventilations, équipements d'aspiration de gaz, etc.).
- Les examens médicaux complémentaires spécifiques à prescrire de toute urgence ou régulièrement (à partir de Biotox, ex: ECG, audiogramme pour agents ototoxiques comme le styrène, NFS, spirométrie EFR, radio du thorax, dosages urinaires biologiques).
- Le type de surveillance requis (ex: SMR - Surveillance Médicale Renforcée, ou SIR - Suivi Individuel Renforcé) et la périodicité de visite conseillée (en mois).

Votre retour doit être au format JSON respectant strictement cette structure :
{
  "globalSynthesis": "Texte rédigé en français, technique, rigoureux et rassurant",
  "generalRecommendations": ["Recommandation 1", "Recommandation 2"],
  "chemicalsAnalyzed": [
    {
      "name": "Nom de l'agent",
      "cas": "CAS",
      "vlepCompliance": "Synthèse de la conformité bayésienne (ex: Risque de dépassement de 8.4%)",
      "biotoxIndicator": "Nom exact du biomarqueur et valeur cible (ex: Acide S-phénylmercapturique < 25µg)",
      "metropolMethod": "Référence méthode prélèvement",
      "requiredExams": ["Examen clinique ciblé", "Dosage biologique..."],
      "surveillanceType": "SIR ou SMR"
    }
  ],
  "ergonomicAnalyzed": [
    {
      "type": "Manutention manuelle ISO 11228-1",
      "riskLevel": "Faible / Moyen / Élevé (Indice de Levage de x)",
      "findings": "Analyse des contraintes posturales déduites des facteurs de réduction",
      "recommendations": ["Aide mécanique", "Formation Gestes et Postures"],
      "requiredExams": ["Bilan ostéoarticulaire (rachis et membres supérieurs)"]
    }
  ],
  "nextReviewMonths": 12
}

Ne renvoyez que le JSON valide, sans blocs d'enrobage.
`;

    const response = await generateContentWithRetry(aiClient, {
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      },
    });

    let resultJson = response.text || "{}";
    
    // Clean up
    if (resultJson.startsWith("```json")) {
      resultJson = resultJson.substring(7);
    }
    if (resultJson.endsWith("```")) {
      resultJson = resultJson.substring(0, resultJson.length - 3);
    }

    res.json(JSON.parse(resultJson.trim()));

  } catch (error: any) {
    console.error("Error generating report via Gemini:", error);
    res.status(500).json({
      error: error.message || "Erreur interne lors de la rédaction de la synthèse de santé."
    });
  }
});

// Serve frontend assets
async function startServer() {
  // Vite integrated middleware setup for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OK] Serveur en écoute sur http://localhost:${PORT}`);
  });
}

startServer();
