import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load local environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// High-density body parsing
app.use(express.json({ limit: "15mb" }));

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("La clé d'API GEMINI_API_KEY n'est pas configurée. Veuillez ajouter votre clé dans le panneau Paramètres > Secrets.");
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return geminiClient;
}

// 2. Full-Stack AI PDF Extraction route
app.post("/api/analyze-pdf", async (req, res) => {
  const { text, type } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Aucun texte fourni pour analyse." });
  }

  try {
    const isGeminiAvailable = !!process.env.GEMINI_API_KEY;

    if (isGeminiAvailable) {
      // 1. GEMINI ANALYSIS ENGINE
      const ai = getGeminiClient();
      const modelName = "gemini-3.5-flash";

      // Select system instruction and schema based on type
      let systemInstruction = "Tu es un expert agréé en santé, ergonomie au travail, DUER et FDS. Analyse le texte fourni issu de documents professionnels et extrait toutes les structures de données exhaustives au format JSON strict.";
      let schema: any;

      if (type === "workstations") {
        systemInstruction += "\nExtrais tous les postes de travail mentionnés dans le document de façon exhaustive.";
        schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nom du poste de travail en français (ex: Opérateur de conditionnement, Secrétaire-Comptable)" },
              unitName: { type: Type.STRING, description: "Nom de l'Unité de Travail associée en français (ex: Production, Administration)" },
              description: { type: Type.STRING, description: "Descriptif du poste de travail et de ses tâches principales en français" },
              employeeCount: { type: Type.INTEGER, description: "Nombre total de salariés sur ce poste (mettez 1 si non spécifié)" },
              demographics: {
                type: Type.OBJECT,
                properties: {
                  women: { type: Type.INTEGER, description: "Nombre de femmes sur ce poste (0 par défaut)" },
                  men: { type: Type.INTEGER, description: "Nombre d'hommes sur ce poste (0 par défaut)" },
                  under18: { type: Type.INTEGER, description: "Nombre de moins de 18 ans sur ce poste (0 par défaut)" },
                  disabled: { type: Type.INTEGER, description: "Nombre de RQTH / salariés en situation de handicap (0 par défaut)" },
                  nightWorker: { type: Type.INTEGER, description: "Nombre de travailleurs de nuit (0 par défaut)" }
                },
                required: ["women", "men", "under18", "disabled", "nightWorker"]
              }
            },
            required: ["name", "unitName", "description", "employeeCount", "demographics"]
          }
        };
      } else if (type === "duer") {
        systemInstruction += "\nExtrais l'intégralité des évaluations de risques détectées. Tu dois impérativement déduire et préconise les protocoles de métrologie d'ambiance et les indicateurs biologiques (IBE) de l'INRS (BIOTOX et MétroPol) pour tout risque physique (bruit, vibrations) ou chimique.";
        schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              unitName: { type: Type.STRING, description: "Nom exact de l'Unité de Travail concernée en français (ex: Atelier Principal, Bureaux)" },
              category: { 
                type: Type.STRING, 
                description: "Catégorie du risque. Choisis UNIQUEMENT parmi : 'Chute de hauteur / de plain-pied', 'Troubles Musculo-Squelettiques (TMS)', 'Risques Psychosociaux (RPS)', 'Risque Chimique', 'Bruit et Vibrations', 'Risque Électrique', 'Incendie et Explosion', 'Risque Biologique', 'Travail sur Écran', 'Risque Routier', 'Machines et Équipements'" 
              },
              dangerSource: { type: Type.STRING, description: "Situation de travail à risque ou source de danger concrète en français (ex: Utilisation de méthanol pour dégraissage, Exposition sonore)" },
              gravity: { type: Type.INTEGER, description: "Niveau de gravité de 1 (faible) à 4 (très grave)" },
              frequency: { type: Type.INTEGER, description: "Niveau de fréquence d'exposition de 1 (rare) à 4 (très fréquent)" },
              masteryCoeff: { type: Type.NUMBER, description: "Coefficient de maîtrise actuel (compris entre 0.3 et 1.0)" },
              existingMeasures: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Liste des mesures de prévention existantes en place (courtes, max 3) en français"
              },
              recommendedMeasures: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Liste des mesures collectives/individuelles préconisées (courtes, max 3) en français"
              },
              metrology: { type: Type.STRING, description: "Conseils et protocoles officiels de métrologie d'ambiance de l'INRS en français (MétroPol), par exemple: 'Prélèvement actif d'ambiance sur tube de gel de silice, analyse GC-FID (INRS MétroPol). VLEP : 200 ppm / 260 mg/m³' pour le méthanol, ou 'Dosimétrie Lex,8h (NF EN ISO 9612)' pour le bruit." },
              ibe: { type: Type.STRING, description: "Indicateurs Biologiques d'Exposition (IBE) de l'INRS en français (BIOTOX), par exemple: 'Dosage du méthanol urinaire en fin de poste - Réf BIOTOX INRS : 15 mg/L.' pour le méthanol." }
            },
            required: ["unitName", "category", "dangerSource", "gravity", "frequency", "masteryCoeff", "existingMeasures", "recommendedMeasures", "metrology", "ibe"]
          }
        };
      } else if (type === "complete_pdf") {
        systemInstruction += "\nAnalyse l'intégralité du DUER complet et réalise une extraction consolidée et rigoureuse de toutes ses rubriques réglementaires (l'entreprise, les UTs, les postes, les risques et les fiches FDS). Ne limite jamais les tableaux à 4 ou 5 éléments : extrais exhaustivement tout ce qui est détecté.";
        schema = {
          type: Type.OBJECT,
          properties: {
            company: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Nom de l'établissement/entreprise (ex: SERAM INDUSTRIES)" },
                siret: { type: Type.STRING, description: "Numéro SIRET si détecté" },
                address: { type: Type.STRING, description: "Adresse postale physique complète" },
                contactName: { type: Type.STRING, description: "Nom du dirigeant ou de la personne responsable de la prévention" },
                contactEmail: { type: Type.STRING, description: "Adresse e-mail s'il y en a une" },
                activitySector: { type: Type.STRING, description: "Secteur d'activité principal (ex: Conception et Fabrication de machines)" },
                description: { type: Type.STRING, description: "Brève description introductive formulée en français" }
              },
              required: ["name", "siret", "address", "contactName", "contactEmail", "activitySector", "description"]
            },
            units: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nom clair de l'unité de travail (ex: UT 1 : LOCAUX COMMUNS - BUREAUX)" },
                  description: { type: Type.STRING, description: "Description générale de l'unité de travail en français" },
                  totalCDI: { type: Type.INTEGER, description: "Nombre d'employés permanents affectés" },
                  totalCDD: { type: Type.INTEGER, description: "Nombre de CDD/Intérim (0 par défaut)" }
                },
                required: ["name", "description", "totalCDI", "totalCDD"]
              }
            },
            workstations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nom du poste de travail en français (ex: Opérateur de production)" },
                  unitName: { type: Type.STRING, description: "Nom exact de l'unité de travail associée" },
                  description: { type: Type.STRING, description: "Descriptif du poste et de ses tâches en français" },
                  employeeCount: { type: Type.INTEGER, description: "Effectif affecté sur ce poste" },
                  demographics: {
                    type: Type.OBJECT,
                    properties: {
                      women: { type: Type.INTEGER, description: "Nombre de femmes (0 par défaut)" },
                      men: { type: Type.INTEGER, description: "Nombre d'hommes (0 par défaut)" },
                      under18: { type: Type.INTEGER, description: "Effectif mineur de moins de 18 ans" },
                      disabled: { type: Type.INTEGER, description: "Effectif RQTH / handicap" },
                      nightWorker: { type: Type.INTEGER, description: "Effectif travaillant de nuit" }
                    },
                    required: ["women", "men", "under18", "disabled", "nightWorker"]
                  }
                },
                required: ["name", "unitName", "description", "employeeCount", "demographics"]
              }
            },
            evaluations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  unitName: { type: Type.STRING, description: "Nom exact de l'unité de travail concernée" },
                  category: { 
                    type: Type.STRING, 
                    description: "Choisis UNIQUEMENT parmi : 'Chute de hauteur / de plain-pied', 'Troubles Musculo-Squelettiques (TMS)', 'Risques Psychosociaux (RPS)', 'Risque Chimique', 'Bruit et Vibrations', 'Risque Électrique', 'Incendie et Explosion', 'Risque Biologique', 'Travail sur Écran', 'Risque Routier', 'Machines et Équipements'" 
                  },
                  dangerSource: { type: Type.STRING, description: "Situation générant le danger ou source d'exposition en français" },
                  gravity: { type: Type.INTEGER, description: "Niveau de gravité de 1 à 4" },
                  frequency: { type: Type.INTEGER, description: "Niveau de fréquence d'exposition de 1 à 4" },
                  masteryCoeff: { type: Type.NUMBER, description: "Efficacité de maîtrise (compris entre 0.3 et 1.0)" },
                  existingMeasures: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Mesures de prévention existantes en place (courtes, max 3) en français"
                  },
                  recommendedMeasures: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Mesures collectives/individuelles préconisées (courtes, max 3) en français"
                  },
                  metrology: { type: Type.STRING, description: "Conseils et protocoles de métrologie d'ambiance de l'INRS (MétroPol) en français" },
                  ibe: { type: Type.STRING, description: "Indicateurs Biologiques d'Exposition d'après le Référentiel BIOTOX de l'INRS en français" }
                },
                required: ["unitName", "category", "dangerSource", "gravity", "frequency", "masteryCoeff", "existingMeasures", "recommendedMeasures", "metrology", "ibe"]
              }
            },
            fdsSheets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING, description: "Nom du produit / substance chimique" },
                  manufacturer: { type: Type.STRING, description: "Fournisseur / Fabricant" },
                  packaging: { type: Type.STRING, description: "Type de conditionnement usuel ou mesures de protection en français" },
                  casNumbers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Numéros CAS détectés"
                  },
                  hazardPhrases: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Codes des phrases H de danger détectés (ex: H314, H350)"
                  },
                  pictograms: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Mots-clés des pictogrammes CLP : 'corrosive', 'cmr', 'toxic', 'flammable', 'harmful'"
                  }
                },
                required: ["productName", "manufacturer", "packaging", "casNumbers", "hazardPhrases", "pictograms"]
              }
            }
          },
          required: ["company", "units", "workstations", "evaluations", "fdsSheets"]
        };
      } else {
        // "fds" or "fds_pdf"
        systemInstruction += "\nExtrais les propriétés réglementaires de cette Fiche de Données de Sécurité (FDS) de produit de façon sélective et rigoureuse.";
        schema = {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING, description: "Nom commercial du produit ou de la substance" },
            manufacturer: { type: Type.STRING, description: "Nom du fabricant ou fournisseur principal" },
            packaging: { type: Type.STRING, description: "Type de conditionnement usuel en français (ex: Bidon métallique 5L, Spray)" },
            casNumbers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Liste des numéros CAS des agents chimiques actifs détectés (format XX-XX-X)"
            },
            hazardPhrases: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Liste des codes de phrases de danger H200 à H499 identifiés (ex: H314, H350)"
            },
            pictograms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Pictogrammes CLP à retenir (choisir parmi: 'corrosive', 'cmr', 'toxic', 'flammable', 'harmful')"
            }
          },
          required: ["productName", "manufacturer", "packaging", "casNumbers", "hazardPhrases", "pictograms"]
        };
      }

      const promptMessage = `Analyse exhaustivement et extrait toutes les structures d'informations demandées de façon rigoureuse selon les spécifications.
Ne censure pas ou ne limite pas l'extraction à 4-5 éléments : extrait TOUT de façon exhaustive sans fusionner les lignes.

Texte source du document :
${text}`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptMessage,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.1,
        }
      });

      const textResponse = response.text;
      if (!textResponse) {
        throw new Error("L'API Gemini a retourné une réponse vide.");
      }

      const parsedData = JSON.parse(textResponse.trim());

      // Add sources tags for UI consistency and tracing
      let finalData = parsedData;
      if (Array.isArray(finalData)) {
        finalData = finalData.map((item: any) => ({ ...item, sources: ["gemini"] }));
      } else if (finalData && typeof finalData === "object") {
        if (type === "complete_pdf") {
          if (finalData.units) finalData.units = finalData.units.map((u: any) => ({ ...u, sources: ["gemini"] }));
          if (finalData.workstations) finalData.workstations = finalData.workstations.map((w: any) => ({ ...w, sources: ["gemini"] }));
          if (finalData.evaluations) finalData.evaluations = finalData.evaluations.map((e: any) => ({ ...e, sources: ["gemini"] }));
          if (finalData.fdsSheets) finalData.fdsSheets = finalData.fdsSheets.map((f: any) => ({ ...f, sources: ["gemini"] }));
        } else {
          finalData.sources = ["gemini"];
        }
      }

      return res.json({
        isDoubleAnalysis: false,
        minimaxActive: false,
        minimaxError: null,
        data: finalData,
        geminiRaw: parsedData,
        minimaxRaw: null
      });

    } else {
      // 2. EXCLUSIVE MINIMAX BACKUP ANALYSIS (only if GEMINI_API_KEY is not defined, but MINIMAX_API_KEY is)
      const minimaxKey = process.env.MINIMAX_API_KEY;
      if (!minimaxKey) {
        return res.status(503).json({ 
          error: "Le service d'intelligence artificielle Gemini n'est pas configuré. Veuillez ajouter votre clé d'API GEMINI_API_KEY dans le panneau Paramètres > Secrets." 
        });
      }

      let prompt = "";
      if (type === "workstations") {
        prompt = `Analyze the following workstation descriptions, organizational charts, or workforce documents and extract the corresponding workstations as strict JSON according to the following TypeScript interface.
[{
  "name": string,
  "unitName": string,
  "description": string,
  "employeeCount": number,
  "demographics": {
    "women": number,
    "men": number,
    "under18": number,
    "disabled": number,
    "nightWorker": number
  }
}]
${text}`;
      } else if (type === "duer") {
        prompt = `Analyze the following risk assessment / Single Document (DUER) and extract the corresponding risk evaluations as strict JSON according to the following TypeScript interface.
[{
  "unitName": string,
  "category": string,
  "dangerSource": string,
  "gravity": number,
  "frequency": number,
  "masteryCoeff": number,
  "existingMeasures": string[],
  "recommendedMeasures": string[],
  "metrology": string,
  "ibe": string
}]
${text}`;
      } else if (type === "complete_pdf") {
        prompt = `Analyze the entire risk assessment report / complete DUER document below and perform a consolidated, rigorous extraction of all regulatory sections as strict JSON matching the specified TypeScript structure.
{
  "company": {
    "name": string,
    "siret": string,
    "address": string,
    "contactName": string,
    "contactEmail": string,
    "activitySector": string,
    "description": string
  },
  "units": [{ "name": string, "description": string, "totalCDI": number, "totalCDD": number }],
  "workstations": [{ "name": string, "unitName": string, "description": string, "employeeCount": number, "demographics": { "women": number, "men": number, "under18": number, "disabled": number, "nightWorker": number } }],
  "evaluations": [{ "unitName": string, "category": string, "dangerSource": string, "gravity": number, "frequency": number, "masteryCoeff": number, "existingMeasures": string[], "recommendedMeasures": string[], "metrology": string, "ibe": string }],
  "fdsSheets": [{ "productName": string, "manufacturer": string, "packaging": string, "casNumbers": string[], "hazardPhrases": string[], "pictograms": string[] }]
}
${text}`;
      } else {
        prompt = `Analyze the following textual excerpt from a chemical Safety Data Sheet (FDS) and extract its key regulatory properties in strict JSON format.
{
  "productName": string,
  "manufacturer": string,
  "packaging": string,
  "casNumbers": string[],
  "hazardPhrases": string[],
  "pictograms": string[]
}
${text}`;
      }

      const rawModel = process.env.MINIMAX_MODEL || "minimax-text-01";
      let model = rawModel.trim().toLowerCase();
      if (model === "minimax-m3-512k") {
        model = "minimax-text-01";
      }

      const makeMinimaxCall = async (selectedModel: string) => {
        return await fetch("https://api.minimaxi.chat/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${minimaxKey}`
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: "system",
                content: "Tu es un expert en DUER/FDS. Analyse et retourne UNIQUEMENT le JSON demandé."
              },
              {
                role: "user",
                content: prompt
              }
            ]
          })
        });
      };

      let resMinimaxClient = await makeMinimaxCall(model);
      if (!resMinimaxClient.ok) {
        if (model !== "minimax-text-01") {
          model = "minimax-text-01";
          resMinimaxClient = await makeMinimaxCall(model);
        }
      }

      if (!resMinimaxClient.ok) {
        const errMsg = await resMinimaxClient.text();
        return res.status(resMinimaxClient.status).json({ 
          error: `Erreur de l'API MiniMax : ${errMsg}` 
        });
      }

      const responseJson = await resMinimaxClient.json();
      const content = responseJson.choices?.[0]?.message?.content;
      if (!content) {
        return res.status(502).json({ error: "L'API MiniMax a retourné une réponse vide." });
      }

      const cleanContent = content.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      const minimaxResult = JSON.parse(cleanContent);

      let finalData = minimaxResult;
      if (Array.isArray(finalData)) {
        finalData = finalData.map((item: any) => ({ ...item, sources: ["minimax"] }));
      } else if (finalData && typeof finalData === "object") {
        if (type === "complete_pdf") {
          if (finalData.units) finalData.units = finalData.units.map((u: any) => ({ ...u, sources: ["minimax"] }));
          if (finalData.workstations) finalData.workstations = finalData.workstations.map((w: any) => ({ ...w, sources: ["minimax"] }));
          if (finalData.evaluations) finalData.evaluations = finalData.evaluations.map((e: any) => ({ ...e, sources: ["minimax"] }));
          if (finalData.fdsSheets) finalData.fdsSheets = finalData.fdsSheets.map((f: any) => ({ ...f, sources: ["minimax"] }));
        } else {
          finalData.sources = ["minimax"];
        }
      }

      res.json({
        isDoubleAnalysis: false,
        minimaxActive: true,
        minimaxError: null,
        data: finalData,
        geminiRaw: null,
        minimaxRaw: minimaxResult
      });
    }

  } catch (err: any) {
    console.error("Analysis server error:", err);
    res.status(500).json({ error: `Erreur interne d'analyse IA : ${err.message || err}` });
  }
});

// 3. Vite development middleware setup OR static files helper
async function initializeApp() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Express + Vite server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting Express + Vite server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MedWork full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

initializeApp().catch((err) => {
  console.error("Failed to initialize MedWork application server:", err);
});
