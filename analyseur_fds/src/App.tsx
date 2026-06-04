/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Upload,
  Sliders,
  FileCheck,
  Printer,
  RefreshCw,
  Plus,
  Trash2,
  Building,
  ShieldAlert,
  ClipboardList,
  ChevronRight,
  Info
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { ChemicalAgent, Workstation, ISO11228Params, ISO11228Result, ISO11228_3Params, ISO11228_3Result, BayesianAnalysisResult, HealthSurveillanceReport } from "./types";
import { calculateISO11228, calculateISO11228_3, runBayesianExposureSimulation } from "./utils";

// Static Demo Environments for instant execution
const DEMO_WORKSTATIONS: Workstation[] = [
  {
    id: "composite_strat",
    name: "Atelier Stratification Polyester",
    jobTitle: "Stratifieur / Opérateur de Moulage au Contact",
    situation: "Moulage au contact de coques composites (résine ester + renforts de fibre)",
    chemicals: [
      {
        name: "Styrène (Monomère)",
        cas: "100-42-5",
        percentage: "35-40%",
        hPhrases: ["H226", "H315", "H319", "H332", "H361d", "H372"],
        pictograms: ["GHS02", "GHS07", "GHS08"],
        vlep8h: 100,
        vlep15min: 200,
        unit: "mg/m³",
        biotoxInfo: {
          indicator: "Somme de l'acide mandélique et acide phénylglyoxylique urinaires",
          samplingTime: "Fin de poste de fin de semaine",
          limitValue: "600 mg/g créatinine (Recommandation INRS Biotox)",
          category: "Neurotoxique et oto-toxique (auditif)"
        },
        metropolInfo: {
          methodNumber: "Métropol M-103",
          samplingSupport: "Tube de charbon actif de prélèvement",
          device: "CPG-FID"
        }
      },
      {
        name: "Acétone",
        cas: "67-64-1",
        percentage: "10-20% (Nettoyage outils)",
        hPhrases: ["H225", "H319", "H336"],
        pictograms: ["GHS02", "GHS07"],
        vlep8h: 1210,
        vlep15min: 2420,
        unit: "mg/m³",
        biotoxInfo: {
          indicator: "Acétone urinaire",
          samplingTime: "Fin de poste",
          limitValue: "50 mg/L (INRS Biotox)",
          category: "Solvant d'exposition courante"
        },
        metropolInfo: {
          methodNumber: "Métropol M-103",
          samplingSupport: "Badge passif ou tube charbon",
          device: "CPG-FID"
        }
      }
    ],
    physicalStrains: {
      liftingHandled: true,
      repetitiveWork: true,
      pushPullHandled: false,
      liftingParams: {
        actualWeight: 18,
        durationHours: 3,
        verticalPosition: 40,
        horizontalDistance: 35,
        verticalDistance: 60,
        asymmetryAngle: 30,
        frequency: 1.5,
        coupling: "fair",
        genderReference: "recommended"
      },
      repetitiveParams: {
        technicalActionsPerMin: 40,
        forceBorgScale: 3,
        postureScore: "moderate",
        recoveryDeficitHours: 2,
        additionalFactors: "few",
        durationHours: 4
      }
    }
  },
  {
    id: "peinture_cabine",
    name: "Cabine de Peinture Liquide",
    jobTitle: "Peintre Industriel / Applicateur de Laque",
    situation: "Application au pistolet pneumatique d'apprêts et de laques solvantées",
    chemicals: [
      {
        name: "Toluène",
        cas: "108-88-3",
        percentage: "10-15%",
        hPhrases: ["H225", "H315", "H336", "H361d", "H304", "H373"],
        pictograms: ["GHS02", "GHS07", "GHS08"],
        vlep8h: 192,
        vlep15min: 384,
        unit: "mg/m³",
        biotoxInfo: {
          indicator: "Toluène sanguin ou urinaire / Acide hippurique urinaire",
          samplingTime: "Fin de poste",
          limitValue: "Fin de poste - Toluène urinaire: 0.03 mg/L",
          category: "Neurotoxique / Altération cérébrale"
        },
        metropolInfo: {
          methodNumber: "Métropol M-103",
          samplingSupport: "Tube charbon actif",
          device: "CPG-FID"
        }
      },
      {
        name: "Xylène (Mélange)",
        cas: "1330-20-7",
        percentage: "20-25%",
        hPhrases: ["H226", "H312", "H332", "H315"],
        pictograms: ["GHS02", "GHS07"],
        vlep8h: 221,
        vlep15min: 442,
        unit: "mg/m³",
        biotoxInfo: {
          indicator: "Acides méthylhippuriques urinaires",
          samplingTime: "Fin de poste",
          limitValue: "1.5 g/g créatinine (Indicateur biologique)",
          category: "Solvant organique volatil"
        },
        metropolInfo: {
          methodNumber: "Métropol M-103",
          samplingSupport: "Badge ou tube charbon",
          device: "CPG-FID"
        }
      }
    ],
    physicalStrains: {
      liftingHandled: false,
      repetitiveWork: true,
      pushPullHandled: false,
      liftingParams: {
        actualWeight: 5,
        durationHours: 2,
        verticalPosition: 75,
        horizontalDistance: 25,
        verticalDistance: 30,
        asymmetryAngle: 0,
        frequency: 0.5,
        coupling: "good",
        genderReference: "recommended"
      },
      repetitiveParams: {
        technicalActionsPerMin: 50,
        forceBorgScale: 2,
        postureScore: "moderate",
        recoveryDeficitHours: 0,
        additionalFactors: "few",
        durationHours: 6
      }
    }
  },
  {
    id: "metallerie_decap",
    name: "Sablage et Décapage Métallique",
    jobTitle: "Sableur / Décapeur Métallique — Technicien Anticorrosion",
    situation: "Nettoyage par sablage abrasif de fers anciens revêtus de minium de plomb",
    chemicals: [
      {
        name: "Plomb et ses composés",
        cas: "7439-92-1",
        percentage: "Traces de minium décapé",
        hPhrases: ["H360FD", "H372", "H351"],
        pictograms: ["GHS08"],
        vlep8h: 0.1,
        vlep15min: 0,
        unit: "mg/m³",
        biotoxInfo: {
          indicator: "Plombémie sanguine (Plomb total dans le sang)",
          samplingTime: "Visite médicale périodique",
          limitValue: "Hommes: 200 µg/L | Femmes (procréation): 70 µg/L (Réglementaire FR)",
          category: "Effet toxique cumulatif sanguin et neurologique"
        },
        metropolInfo: {
          methodNumber: "Métropol M-003",
          samplingSupport: "Filtre ester de cellulose (fraction inhalable)",
          device: "ICP-AES ou AAS"
        }
      },
      {
        name: "Silice Cristalline (Quartz)",
        cas: "14808-60-7",
        percentage: "Dérivé du sable abrasif",
        hPhrases: ["H372", "H350"],
        pictograms: ["GHS08"],
        vlep8h: 0.1,
        vlep15min: 0,
        unit: "mg/m³",
        biotoxInfo: {
          indicator: "Absence de biomarqueur urinaire de routine - Évaluation pulmonaire par EFR + Radio",
          samplingTime: "Suivi renforcé périodique",
          limitValue: "Contrôle spirométrique récurrent annuel",
          category: "Altération irréversible des alvéoles pulmonaires (Silicose)"
        },
        metropolInfo: {
          methodNumber: "Métropol M-259",
          samplingSupport: "Filtre PVC avec cyclone de tri d'alvéoles",
          device: "Diffraction de rayons X (DRX) ou IRTF"
        }
      }
    ],
    physicalStrains: {
      liftingHandled: true,
      repetitiveWork: true,
      pushPullHandled: true,
      liftingParams: {
        actualWeight: 25,
        durationHours: 4,
        verticalPosition: 30,
        horizontalDistance: 45,
        verticalDistance: 90,
        asymmetryAngle: 15,
        frequency: 3,
        coupling: "poor",
        genderReference: "male"
      },
      repetitiveParams: {
        technicalActionsPerMin: 30,
        forceBorgScale: 6,
        postureScore: "severe",
        recoveryDeficitHours: 3,
        additionalFactors: "multiple",
        durationHours: 5
      }
    }
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"import" | "bayesian" | "iso11228" | "report">("import");
  const [ergoSubTab, setErgoSubTab] = useState<"lifting" | "repetitive">("lifting");
  
  // App data state
  const [workstations, setWorkstations] = useState<Workstation[]>(DEMO_WORKSTATIONS);
  const [selectedWorkstationId, setSelectedWorkstationId] = useState<string>("composite_strat");
  
  // Input fields for Custom Analysis
  const [pastedText, setPastedText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedBase64, setUploadedBase64] = useState("");
  const [uploadedMimeType, setUploadedMimeType] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // Bayesian inputs for each CAS and chemical
  const [bayesChemicalId, setBayesChemicalId] = useState<string>(" styrène "); // links to chemical selection
  const [selectedChemical, setSelectedChemical] = useState<ChemicalAgent | null>(DEMO_WORKSTATIONS[0].chemicals[0]);
  const [rawMeasurements, setRawMeasurements] = useState<string>("45.2, 112.4, 88.0, 134.5, 62.1");
  const [vlepOverride, setVlepOverride] = useState<number>(100);
  const [unitOverride, setUnitOverride] = useState<string>("mg/m³");
  
  // Real-time calculated results for Bayesian Exposure
  const [bayesianResult, setBayesianResult] = useState<BayesianAnalysisResult | null>(null);

  // ISO 11228 Inputs
  const [isoParams, setIsoParams] = useState<ISO11228Params>(DEMO_WORKSTATIONS[0].physicalStrains.liftingParams!);
  const [isoResult, setIsoResult] = useState<ISO11228Result | null>(null);

  // ISO 11228-3 Inputs (Repetitive Work / OCRA)
  const [repetitiveParams, setRepetitiveParams] = useState<ISO11228_3Params>({
    technicalActionsPerMin: 40,
    forceBorgScale: 3,
    postureScore: "moderate",
    recoveryDeficitHours: 2,
    additionalFactors: "few",
    durationHours: 4
  });
  const [repetitiveResult, setRepetitiveResult] = useState<ISO11228_3Result | null>(null);

  // Health Surveillance Report State
  const [reportData, setReportData] = useState<HealthSurveillanceReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Get active workstation object
  const activeWorkstation = workstations.find(w => w.id === selectedWorkstationId) || workstations[0];

  useEffect(() => {
    // When active workstation changes, synchronize chemical selections and ISO parameters
    if (activeWorkstation) {
      if (activeWorkstation.chemicals.length > 0) {
        const chem = activeWorkstation.chemicals[0];
        setSelectedChemical(chem);
        setVlepOverride(chem.vlep8h);
        setUnitOverride(chem.unit);
        
        // Populate representative simulation concentrations based on chemical
        if (chem.cas === "100-42-5") {
          setRawMeasurements("45.2, 112.4, 88.0, 134.5, 62.1");
        } else if (chem.cas === "67-64-1") {
          setRawMeasurements("150.0, 310.5, 420.0, 240.2, 185.0");
        } else if (chem.cas === "108-88-3") {
          setRawMeasurements("15.2, 28.4, 42.1, 19.5, 30.2");
        } else if (chem.cas === "1330-20-7") {
          setRawMeasurements("34.1, 48.0, 72.3, 53.0, 68.2");
        } else if (chem.cas === "7439-92-1") { // lead
          setRawMeasurements("0.02, 0.05, 0.09, 0.04, 0.06");
        } else if (chem.cas === "14808-60-7") { // quartz
          setRawMeasurements("0.04, 0.11, 0.18, 0.09, 0.07");
        } else {
          setRawMeasurements("0.1, 0.4, 0.5, 0.2");
        }
      }
      
      if (activeWorkstation.physicalStrains.liftingParams) {
        setIsoParams(activeWorkstation.physicalStrains.liftingParams);
      }
      if (activeWorkstation.physicalStrains.repetitiveParams) {
        setRepetitiveParams(activeWorkstation.physicalStrains.repetitiveParams);
      }
    }
  }, [selectedWorkstationId]);

  // Recalculate Bayesian Statistics on simulation inputs change
  useEffect(() => {
    if (selectedChemical) {
      const numbers = rawMeasurements
        .split(",")
        .map(x => parseFloat(x.trim()))
        .filter(x => !isNaN(x) && x > 0);
      
      const res = runBayesianExposureSimulation(
        selectedChemical.name,
        vlepOverride || 1,
        unitOverride || "mg/m³",
        numbers
      );
      setBayesianResult(res);
    }
  }, [selectedChemical, rawMeasurements, vlepOverride, unitOverride]);

  // Recalculate ISO 11228 values on params change
  useEffect(() => {
    if (isoParams) {
      const res = calculateISO11228(isoParams);
      setIsoResult(res);
    }
  }, [isoParams]);

  // Recalculate ISO 11228-3 values on repetitive params change
  useEffect(() => {
    if (repetitiveParams) {
      const res = calculateISO11228_3(repetitiveParams);
      setRepetitiveResult(res);
    }
  }, [repetitiveParams]);

  // Handle Drag & Drop / File inputs
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processLocalFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLocalFile(file);
    }
  };

  const processLocalFile = (file: File) => {
    setUploadedFileName(file.name);
    setUploadedMimeType(file.type);
    
    const reader = new FileReader();
    
    // If it's a raw text file, we can read it directly
    if (file.type.startsWith("text/") || file.name.endsWith(".json") || file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
      reader.onload = (event) => {
        const textContent = event.target?.result as string;
        setPastedText(textContent);
      };
      reader.readAsText(file);
    } else {
      // For binary files (images/PDFs), read as Base64 for multimodal analysis
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(",")[1];
        setUploadedBase64(base64String);
        setPastedText(`[Analyse d'image/document en pièce jointe: ${file.name}]`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit for AI processing
  const handleDocumentAnalysisSubmit = async () => {
    setIsAnalyzing(true);
    setAnalysisError("");
    try {
      const response = await fetch("/api/analyze-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: pastedText,
          fileData: uploadedBase64,
          fileName: uploadedFileName,
          fileMimeType: uploadedMimeType
        })
      });

      if (!response.ok) {
        let serverErrorMsg = "";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            serverErrorMsg = errData.error;
          }
        } catch (e) {
          // Ignore parse errors on bad responses
        }
        throw new Error(serverErrorMsg || "Une erreur est survenue lors de l'analyse du document. Vérifiez l'intégrité de la Fiche de Données ou de l'API.");
      }

      const data = await response.json();
      
      if (data && data.workstations && data.workstations.length > 0) {
        // Append newly parsed workstation
        const parsedWorkstations: Workstation[] = data.workstations.map((w: any, index: number) => ({
          ...w,
          id: `custom_parsed_${Date.now()}_${index}`
        }));
        
        setWorkstations(prev => [...parsedWorkstations, ...prev]);
        setSelectedWorkstationId(parsedWorkstations[0].id);
        
        setActiveTab("import");
        alert("Fiche de données analysée avec succès par l'IA ! Nouveau poste de travail ajouté au référentiel.");
      } else {
        throw new Error("L'extraction IA n'a détecté aucun poste de travail ou substance exploitable.");
      }
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Impossible d'analyser le document.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger server-side Health Surveillance report generation
  const handleGenerateReport = async () => {
    if (!activeWorkstation) return;
    
    setIsGeneratingReport(true);
    try {
      // Bundle current interactive states to provide full-fidelity dynamic synthesis
      const payload = {
        workstation: activeWorkstation,
        baysianRuns: bayesianResult,
        isoResults: isoResult
      };

      const response = await fetch("/api/generate-health-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let serverErrorMsg = "";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            serverErrorMsg = errData.error;
          }
        } catch (e) {
          // Ignore
        }
        throw new Error(serverErrorMsg || "Erreur de communication avec le module médical d'IA.");
      }

      const report = await response.json();
      setReportData(report);
      setActiveTab("report");
    } catch (err: any) {
      alert("Une erreur s'est produite lors de la rédaction de la synthèse de surveillance : " + err.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Quick helper to fetch a demo FDS raw text to let user see how parsing works immediately
  const handleLoadDemoText = () => {
    setPastedText(`FICHE DE DONNEES DE SECURITE - CHROME VI & PLOMB PROTECT
Section 1: Identification du mélange
Nom commercial: CHROMATOX - PRIMER S
Usage: Primaire d'accroche aéronautique et anticorrosion industrielle destiné aux techniciens d'atelier de peinture et monteurs de structure.

Section 3: Composition / informations sur les composants
- Trioxyde de chrome (Chrome VI): CAS 1333-82-0, Conc: 8%. Classification H: H350 (Peut provoquer le cancer), H340 (Peut provoquer des anomalies génétiques), H314 (Brûlures graves de la peau).
- Chromate de zinc et potassium: CAS 11103-86-9, Conc: 15%. Classification H: H350, H317 (Sensibilisation cutanée).
- Silate d'alumine (Abrasif poussières): CAS 1302-76-7, Conc: 5%.

Situation de travail observée (DUERP 2026):
1. Poste: Peintre applicateur en atelier industriel de chaudronnerie.
2. Tâche répétitive: Application par pulvérisation pneumatique dans une cabine semi-ouverte avec asymétrie de mouvement de 45° lors du séchage.
Manutention manuelle détectée: Manipulation quotidienne de fûts de peinture de 22 kg déplacés du stockeur vers la cuve de mélange (hauteur de 90 cm, reach horizontal de 40 cm, 3 rotations par heure).`);
    setUploadedFileName("FDS_Exemple_Chromatox_Anticorrosion.txt");
  };

  // Compute log-normal probability density curve for plotting
  const getLogNormalPlotData = () => {
    if (!bayesianResult || !selectedChemical) return [];
    
    const plotData = [];
    const minLimit = 0.001;
    // Set plot bounds to represent log-normal shape around VLEP
    const steps = 60;
    const limitVal = vlepOverride || 1;
    const maxBound = limitVal * 2.5;
    const increment = maxBound / steps;

    // Use simulated Mode of distribution
    const mu = Math.log(bayesianResult.gmEstimate);
    const sigma = Math.log(bayesianResult.gsdEstimate);

    for (let i = 0; i <= steps; i++) {
      const x = Math.max(minLimit, i * increment);
      // Log normal probability density function formula
      const exponent = -Math.pow(Math.log(x) - mu, 2) / (2 * Math.pow(sigma, 2));
      const y = (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
      
      plotData.push({
        concentration: Number(x.toFixed(3)),
        densite: Number(y.toFixed(5)),
        isAboveVlep: x > limitVal
      });
    }
    return plotData;
  };

  const chartData = getLogNormalPlotData();

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-200 font-sans leading-relaxed selection:bg-blue-600/30 selection:text-white">
      {/* Dynamic Background Design Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0F1117] print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold select-none shadow-[0_0_10px_rgba(37,99,235,0.4)]">Σ</div>
          <div>
            <h1 className="text-md md:text-lg font-bold tracking-tight text-white uppercase font-display leading-none">
              ChemStat <span className="text-blue-500">Pro</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">HEALTH & CHEMICAL INTEL</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex gap-4 text-[10px] font-mono">
            <span className="text-emerald-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              BIOTOX CONNECTED
            </span>
            <span className="text-emerald-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              METROPOL SYNC
            </span>
          </div>
          
          <div className="hidden md:block w-px h-6 bg-white/10"></div>
          
          {/* Workstation selector styled beautifully */}
          <div className="flex items-center gap-2 bg-[#151921] px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider pl-1 font-semibold">Active Atmos :</span>
            <select
              value={selectedWorkstationId}
              onChange={(e) => setSelectedWorkstationId(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-blue-400 focus:outline-none cursor-pointer pr-1"
            >
              {workstations.map(w => (
                <option key={w.id} value={w.id} className="bg-[#151921] text-slate-200">{w.name}</option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase leading-none font-semibold">Expert Analyst</p>
              <p className="text-xs font-medium text-slate-300 leading-tight">Dr. Aris Thorne</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/20 shadow-md"></div>
          </div>
        </div>
      </header>

      {/* Main navigation tab-bar */}
      <nav className="bg-[#0F1117] border-b border-white/10 sticky top-0 z-40 shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-6 flex overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab("import")}
            className={`py-4 px-4 text-xs font-bold font-mono uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "import"
                ? "border-blue-500 text-blue-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/10"
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>1. Importation & Extraction</span>
          </button>
          
          <button
            onClick={() => setActiveTab("bayesian")}
            className={`py-4 px-4 text-xs font-bold font-mono uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "bayesian"
                ? "border-blue-500 text-blue-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/10"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>2. Analyse Bayésienne</span>
          </button>

          <button
            onClick={() => setActiveTab("iso11228")}
            className={`py-4 px-4 text-xs font-bold font-mono uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "iso11228"
                ? "border-blue-500 text-blue-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/10"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>3. Ergonomie (ISO 11228)</span>
          </button>

          <button
            onClick={() => setActiveTab("report")}
            className={`py-4 px-4 text-xs font-bold font-mono uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ml-auto cursor-pointer ${
              activeTab === "report"
                ? "border-emerald-500 text-emerald-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/10"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>4. Rapport de Surveillance</span>
            {reportData && (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-normal">
                Prêt
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6 md:p-8">
        
        {/* Active Workstation Banner Detail */}
        <div className="mb-6 bg-[#151921] text-slate-100 rounded-xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10 border-l-4 border-l-blue-500 relative overflow-hidden print:hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[50px] rounded-full -mr-16 -mt-16 select-none pointer-events-none"></div>
          <div className="space-y-1 relative z-10">
            <p className="text-[9px] tracking-widest font-mono text-slate-500 uppercase font-semibold">Atmosphère Actuellement Analysée</p>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building className="w-4.5 h-4.5 text-blue-450" />
              {activeWorkstation?.name || "Nouveau poste"}
            </h2>
            {activeWorkstation?.jobTitle && (
              <p className="text-blue-300 text-xs font-semibold font-mono">
                <strong className="text-slate-400 font-mono">Poste occupé :</strong> {activeWorkstation.jobTitle}
              </p>
            )}
            <p className="text-slate-300 text-xs font-light">
              <strong className="text-slate-400 font-mono">Activité :</strong> {activeWorkstation?.situation}
            </p>
          </div>
          
          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="relative z-10 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-mono uppercase tracking-wider font-bold text-xs py-3 px-6 rounded-lg flex items-center gap-2 transition duration-150 shadow-[0_0_15px_rgba(37,99,235,0.25)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 cursor-pointer self-stretch md:self-auto justify-center"
          >
            {isGeneratingReport ? (
              <>
                <RefreshCw className="animate-spin w-4 h-4 text-blue-200" />
                <span>Rédaction IA en cours...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4 text-blue-200" />
                <span>Générer Synthèse de Santé</span>
              </>
            )}
          </button>
        </div>

        {/* Tab 1: IMPORT & EXTRACTION */}
        {activeTab === "import" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Form: upload and pasting */}
              <div className="lg:col-span-2 space-y-6 bg-[#151921] p-6 rounded-xl shadow-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none select-none"></div>
                
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-md font-bold text-white uppercase font-display tracking-wide">Importer une nouvelle FDS / Document Unique</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Chargez une fiche technique ou copiez-collez les informations textuelles pour en extraire les dangers et les situations d'exposition physiques.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadDemoText}
                    className="text-[10px] font-bold font-mono tracking-wider uppercase text-blue-450 bg-blue-500/10 hover:bg-blue-500/20 py-1.5 px-3 rounded border border-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1" />
                    <span>Exemple</span>
                  </button>
                </div>

                {/* Drag and drop area */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="border border-dashed border-white/10 rounded-xl p-6 text-center hover:border-blue-500/50 transition-all bg-[#0F1117] cursor-pointer group"
                >
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".txt,.pdf,.jpg,.png,.csv,.json"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                    <div className="inline-flex bg-[#151921] rounded-lg p-3 shadow-md border border-white/10 group-hover:scale-105 transition-transform duration-150">
                      <Upload className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        Glissez-déposez la FDS / le Document Unique ou <span className="text-blue-400 underline decoration-blue-500/50 hover:text-blue-300">parcourez vos fichiers</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Prend en charge les formats FDS au format texte, PDF, rapports de situations ou captures de danger.
                      </p>
                    </div>
                    {uploadedFileName && (
                      <div className="inline-block bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] py-1 px-2.5 rounded font-mono mt-2 select-none">
                        📥 Fichier relié : {uploadedFileName}
                      </div>
                    )}
                  </label>
                </div>

                {/* Copy paste zone */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-widest">Informations Textuelles / Données de la FDS</label>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Copiez-collez ici le contenu de la section composition (Section 3), les valeurs limites de la section 8, ou le descriptif des situations du Document Unique professionnel..."
                    rows={10}
                    className="w-full bg-[#0F1117] border border-white/10 rounded-xl p-4 text-xs font-mono focus:outline-none focus:border-blue-500 focus:bg-[#12141c] text-slate-200 placeholder-slate-600 transition-all leading-normal"
                  />
                </div>

                {analysisError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-start gap-2.5 font-sans">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                    <p>{analysisError}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDocumentAnalysisSubmit}
                  disabled={isAnalyzing || (!pastedText && !uploadedBase64)}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold font-mono text-xs uppercase tracking-widest py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 transition duration-150 shadow-[0_4px_12px_rgba(37,99,235,0.2)] disabled:opacity-50 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="animate-spin w-4 h-4 text-blue-200" />
                      <span>Extraction et Analyse IA des Risques Chimiques...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 text-blue-200" />
                      <span>Lancer l'Extraction Structurée & de VLEP</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Panel: Displaying the active details found */}
              <div className="space-y-6">
                
                {/* Workplace Chemicals List */}
                <div className="bg-[#151921] p-6 rounded-xl shadow-2xl border border-white/5 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-blue-500" />
                    Agents Chimiques Identifiés
                  </h3>
                  
                  {activeWorkstation.chemicals.length === 0 ? (
                    <p className="text-xs text-slate-500 font-light italic">Aucune substance extraite sur ce poste.</p>
                  ) : (
                    <div className="space-y-3">
                      {activeWorkstation.chemicals.map((chem, idx) => (
                        <div
                          key={idx}
                          role="button"
                          onClick={() => {
                            setSelectedChemical(chem);
                            setVlepOverride(chem.vlep8h);
                            setUnitOverride(chem.unit);
                            setActiveTab("bayesian");
                          }}
                          className={`p-3 rounded-lg border transition-all text-left group cursor-pointer ${
                            selectedChemical?.cas === chem.cas
                              ? "bg-[#1c2433] border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30"
                              : "bg-[#0F1117] hover:bg-white/5 border-white/10 text-slate-300"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className={`font-semibold text-sm ${selectedChemical?.cas === chem.cas ? "text-blue-400" : "text-white"}`}>
                              {chem.name}
                            </h4>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                              Conc: {chem.percentage}
                            </span>
                          </div>
                          
                          <p className={`text-[10px] font-mono mt-1 ${selectedChemical?.cas === chem.cas ? "text-slate-300" : "text-slate-500"}`}>
                            Numéro CAS : {chem.cas}
                          </p>

                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {chem.hPhrases.map((h, i) => (
                              <span key={i} className="text-[9px] font-mono bg-rose-500/10 border border-rose-500/20 text-rose-450 px-1 py-0.5 rounded">
                                {h}
                              </span>
                            ))}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-white/5 flex justify-between items-center text-[10px]">
                            <span className={selectedChemical?.cas === chem.cas ? "text-slate-300" : "text-slate-400"}>
                              VLEP 8h : <strong>{chem.vlep8h || "N/A"}</strong> {chem.unit}
                            </span>
                            <span className="text-blue-400 hover:text-blue-300 underline flex items-center gap-0.5 font-bold font-mono uppercase tracking-wider text-[9px]">
                              Simuler <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Workplace Ergonomics List */}
                <div className="bg-[#151921] p-6 rounded-xl shadow-2xl border border-white/5 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-blue-500" />
                    Contraintes Physiques Détectées
                  </h3>

                  <div className="space-y-3 font-medium text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300">
                      <span>Manutention manuelle (ISO 11228-1)</span>
                      {activeWorkstation.physicalStrains.liftingHandled ? (
                        <span className="bg-orange-550/20 text-orange-400 border border-orange-500/30 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono tracking-wider">Inclus</span>
                      ) : (
                        <span className="text-slate-550 text-[10px] italic">Non mentionné</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">
                      <span>Mouvements répétitifs (ISO 11228-3)</span>
                      {activeWorkstation.physicalStrains.repetitiveWork ? (
                        <span className="bg-purple-550/20 text-purple-400 border border-purple-500/30 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono tracking-wider">Inclus</span>
                      ) : (
                        <span className="text-slate-550 text-[10px] italic">Non mentionné</span>
                      )}
                    </div>
                  </div>

                  {activeWorkstation.physicalStrains.liftingHandled && (
                    <button
                      onClick={() => {
                        if (activeWorkstation.physicalStrains.liftingParams) {
                          setIsoParams(activeWorkstation.physicalStrains.liftingParams);
                        }
                        setActiveTab("iso11228");
                      }}
                      className="w-full bg-[#0F1117] hover:bg-white/5 text-slate-200 border border-white/10 font-bold font-mono text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-150 cursor-pointer"
                    >
                      <span>Configurer les charges d'ISO 11228</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: BAYESIAN EXPOSURE ASSESSMENT */}
        {activeTab === "bayesian" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Controls and sliders */}
              <div className="bg-[#151921] p-6 rounded-xl shadow-2xl border border-white/5 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[50px] rounded-full -mr-16 -mt-16 pointer-events-none select-none"></div>
                <div>
                  <h3 className="text-md font-bold text-white uppercase tracking-wider font-display">Calculateur Bayésien</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Saisissez des mesures d'une campagne de prélèvement pour évaluer statistiquement le taux de dépassement réel de la VLEP.
                  </p>
                </div>

                <div className="space-y-4">
                  
                  {/* Select Substance links */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider">Agent sélectionné pour calcul d'exposition</label>
                    <select
                      value={selectedChemical?.cas}
                      onChange={(e) => {
                        const chem = activeWorkstation.chemicals.find(c => c.cas === e.target.value);
                        if (chem) {
                          setSelectedChemical(chem);
                          setVlepOverride(chem.vlep8h);
                          setUnitOverride(chem.unit);
                        }
                      }}
                      className="w-full bg-[#0F1117] border border-white/10 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      {activeWorkstation.chemicals.map((chem) => (
                        <option key={chem.cas} value={chem.cas} className="bg-[#151921] text-slate-200">{chem.name} ({chem.cas})</option>
                      ))}
                    </select>
                  </div>

                  {/* Range measurements input */}
                  <div className="space-y-1.5 animate-pulse-once">
                    <label className="text-[9px] font-bold text-slate-400 font-mono flex justify-between uppercase tracking-wider">
                      <span>Concentrations d'exposition observées ({unitOverride})</span>
                      <span className="text-slate-500">Séparées par virgules</span>
                    </label>
                    <input
                      type="text"
                      value={rawMeasurements}
                      onChange={(e) => setRawMeasurements(e.target.value)}
                      className="w-full bg-[#0F1117] border border-white/10 rounded-lg p-3 text-xs focus:outline-none focus:border-blue-500 font-mono text-slate-200"
                    />
                    <p className="text-[10px] text-slate-500 font-light">
                      Chaque valeur représente un relevé d'exposition (ex. badge actif individuel sur 8h).
                    </p>
                  </div>

                  {/* VLEP 8h slider limit */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider">Valeur Limite VLEP-8h ({unitOverride})</span>
                      <span className="font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-bold">{vlepOverride}</span>
                    </div>
                    <input
                      type="range"
                      min={0.01}
                      max={vlepOverride > 100 ? vlepOverride * 2 : 250}
                      step={vlepOverride > 100 ? 5 : 0.1}
                      value={vlepOverride}
                      onChange={(e) => setVlepOverride(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#0F1117] rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                </div>

                {/* Biotox matching & metropol reminder */}
                {selectedChemical && (
                  <div className="p-4 bg-[#0F1117] rounded-xl border border-white/5 space-y-3 text-xs">
                    <div className="flex items-center gap-1.5 text-blue-450 font-bold font-mono text-[9px] uppercase tracking-wider">
                      <Info className="w-4 h-4 flex-shrink-0" />
                      <span>Recommandation INRS pour {selectedChemical.name}</span>
                    </div>
                    
                    {selectedChemical.biotoxInfo ? (
                      <div className="space-y-2">
                        <p>
                          <strong className="text-[9px] text-slate-500 uppercase tracking-wider block font-semibold">Biométrologie urinaire (Biotox) :</strong>
                          <span className="text-slate-350">{selectedChemical.biotoxInfo.indicator}</span>
                        </p>
                        <p>
                          <strong className="text-[9px] text-slate-500 uppercase tracking-wider block font-semibold">Moment & Valeur de Prélèvement :</strong>
                          <span className="text-slate-350">{selectedChemical.biotoxInfo.samplingTime} — {selectedChemical.biotoxInfo.limitValue}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic text-[11px]">Pas de biomarqueur urinaire d'exposition spécifique indexé pour ce composé.</p>
                    )}

                    {selectedChemical.metropolInfo && (
                      <p className="pt-1.5 border-t border-white/10" style={{ wordBreak: 'break-word' }}>
                        <strong className="text-[9px] text-slate-500 uppercase tracking-wider block font-semibold">Norme Métrologique Métropol :</strong>
                        <span className="text-slate-355 text-[11px]">N° {selectedChemical.metropolInfo.methodNumber} ({selectedChemical.metropolInfo.samplingSupport})</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Graphical Analysis results and statistical parameters */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Statistics Cards */}
                {bayesianResult && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#151921] p-4 rounded-lg border border-white/5 space-y-1 shadow-md">
                      <p className="text-[9px] uppercase font-mono tracking-wider text-slate-500">GM Estimate (Mode)</p>
                      <p className="text-lg font-bold text-white font-display">{bayesianResult.gmEstimate} <span className="text-xs font-normal text-slate-400">{unitOverride}</span></p>
                    </div>

                    <div className="bg-[#151921] p-4 rounded-lg border border-white/5 space-y-1 shadow-md">
                      <p className="text-[9px] uppercase font-mono tracking-wider text-slate-500">Variabilité (GSD)</p>
                      <p className="text-lg font-bold text-white font-display">{bayesianResult.gsdEstimate}</p>
                    </div>

                    <div className="bg-[#151921] p-4 rounded-lg border border-white/5 space-y-1 shadow-md">
                      <p className="text-[9px] uppercase font-mono tracking-wider text-slate-500">95ème Percentile (P95)</p>
                      <p className="text-lg font-bold text-white font-display">{bayesianResult.p95Estimate} <span className="text-xs font-normal text-slate-400">{unitOverride}</span></p>
                    </div>

                    {/* Exceedance gauge dial */}
                    <div className={`p-4 rounded-lg border space-y-1 shadow-md ${
                      bayesianResult.riskCategory === "green" ? "bg-[#0d2219] border-emerald-500/20 text-emerald-400" :
                      bayesianResult.riskCategory === "yellow" ? "bg-[#241d11] border-amber-500/20 text-amber-400" :
                      "bg-[#261217] border-red-500/20 text-red-400"
                    }`}>
                      <p className="text-[9px] uppercase font-mono tracking-wider opacity-80">Probabilité sur-VLEP</p>
                      <p className="text-lg font-bold">{bayesianResult.exceedanceProb} %</p>
                    </div>
                  </div>
                )}

                {/* Bayesian Distribution Log Normal Visualizer */}
                <div className="bg-[#151921] p-6 rounded-xl shadow-2xl border border-white/5 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-1.5">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Distribution Postérieure (Modèle Log-normal)
                      </h4>
                      <p className="text-xs text-slate-400">Courbe de densité de probabilité basée sur les simulations de Monte Carlo de l'hygiène industrielle.</p>
                    </div>
                    {bayesianResult && (
                      <span className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase border tracking-wider font-mono ${
                        bayesianResult.riskCategory === "green" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        bayesianResult.riskCategory === "yellow" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}>
                        {bayesianResult.riskCategory === "green" ? "✅ Conforme (Risque faible)" :
                         bayesianResult.riskCategory === "yellow" ? "⚠️ Observation requise (Risque moyen)" :
                         "❌ Non-conforme (Risque élevé !)"}
                      </span>
                    )}
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorBelow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="rgb(59,130,246)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="rgb(59,130,246)" stopOpacity={0.01}/>
                          </linearGradient>
                          <linearGradient id="colorAbove" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="rgb(244,63,94)" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="rgb(244,63,94)" stopOpacity={0.02}/>
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="concentration"
                          tick={{ fontSize: 9, fill: '#64748b' }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                          tickLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 9, fill: '#64748b' }}
                          axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                          tickLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                        />
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0F1117', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} />
                        
                        {/* Area below VLEP */}
                        <Area
                          type="monotone"
                          dataKey="densite"
                          stroke="#2563eb"
                          fill="url(#colorBelow)"
                          strokeWidth={2}
                          name="Densité d'exposition"
                        />
                        
                        {/* Reference Line for the Limit threshold */}
                        <ReferenceLine
                          x={vlepOverride}
                          stroke="#ef4444"
                          strokeDasharray="3 3"
                          strokeWidth={1.5}
                          label={{ value: `VLEP: ${vlepOverride}`, fill: '#f43f5e', position: 'top', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Summary guidance on EN 689 / Bayesian significance */}
                  <div className="bg-[#0F1117] p-4.5 rounded-lg border border-white/5 text-xs space-y-2 text-slate-400">
                    <p className="font-bold text-white font-display">🔬 Approche de modélisation Bayesienne & Norme EN 689</p>
                    <p className="leading-relaxed">
                      Conformément aux recommandations de la norme <strong>EN 689</strong>, une simple moyenne arithmétique ne suffit pas à valider l'exposition d'un travailleur à cause des variabilités atmosphériques. Nos calculs de Monte Carlo modélisent la variabilité (GSD) et la moyenne (GM) d'exposition pour simuler les issues d'exposition sur le long terme. Une non-conformité est détectée dès que la chance que le 95ème percentile dépasse la VLEP dépasse 5%.
                    </p>
                  </div>

                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* Tab 3: ISO 11228-1 ERGONOMICS */}
        {activeTab === "iso11228" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Ergonomics Sub-tabs */}
            <div className="flex border-b border-white/10 pb-1 mb-6 gap-6 print:hidden">
              <button
                type="button"
                onClick={() => setErgoSubTab("lifting")}
                className={`pb-3 text-sm font-bold font-mono uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  ergoSubTab === "lifting"
                    ? "border-[#3b82f6] text-[#60a5fa] font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Levage de Charges (ISO 11228-1)</span>
              </button>
              <button
                type="button"
                onClick={() => setErgoSubTab("repetitive")}
                className={`pb-3 text-sm font-bold font-mono uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  ergoSubTab === "repetitive"
                    ? "border-[#3b82f6] text-[#60a5fa] font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Gestes Répétitifs (ISO 11228-3 : OCRA)</span>
                <span className="bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/30 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-normal">
                  OCRA Simplified
                </span>
              </button>
            </div>

            {ergoSubTab === "lifting" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Sliders for ergonomic parameters */}
              <div className="bg-[#151921] p-6 rounded-xl shadow-2xl border border-white/5 space-y-5">
                <div>
                  <h3 className="text-md font-bold text-white uppercase tracking-wider font-display">Variables de Levage ISO 11228-1</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ajustez les éléments physiques observés lors de la tâche manuelle pour quantifier l'Indice de Risque de Levage.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-medium text-slate-400">
                  
                  {/* Select reference mass/gender */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider">Norme de Référence (Genre / Population)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsoParams(prev => ({ ...prev, genderReference: "recommended" }))}
                        className={`text-[10px] uppercase font-bold font-mono py-1.5 px-1 rounded transition-colors cursor-pointer ${
                          isoParams.genderReference === "recommended"
                            ? "bg-blue-600 text-white font-bold border border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                            : "bg-[#0F1117] border border-white/10 text-slate-400 hover:bg-white/5"
                        }`}
                      >
                        Général
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsoParams(prev => ({ ...prev, genderReference: "male" }))}
                        className={`text-[10px] uppercase font-bold font-mono py-1.5 px-1 rounded transition-colors cursor-pointer ${
                          isoParams.genderReference === "male"
                            ? "bg-blue-600 text-white font-bold border border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                            : "bg-[#0F1117] border border-white/10 text-slate-400 hover:bg-white/5"
                        }`}
                      >
                        Hommes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsoParams(prev => ({ ...prev, genderReference: "female" }))}
                        className={`text-[10px] uppercase font-bold font-mono py-1.5 px-1 rounded transition-colors cursor-pointer ${
                          isoParams.genderReference === "female"
                            ? "bg-blue-600 text-white font-bold border border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                            : "bg-[#0F1117] border border-white/10 text-slate-400 hover:bg-white/5"
                        }`}
                      >
                        Femmes
                      </button>
                    </div>
                  </div>

                  {/* Weight slider */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Masse réelle de la charge (kg)</span>
                      <span className="font-mono text-blue-400 font-bold">{isoParams.actualWeight} kg</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      step={1}
                      value={isoParams.actualWeight}
                      onChange={(e) => setIsoParams(prev => ({ ...prev, actualWeight: parseInt(e.target.value) }))}
                      className="w-full text-blue-500 accent-blue-500 cursor-pointer h-1.5 bg-[#0F1117] rounded-lg appearance-none"
                    />
                  </div>

                  {/* Vertical position of hands slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Hauteur de prise (cm)</span>
                      <span className="font-mono text-slate-400">{isoParams.verticalPosition} cm (Sol=0)</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={175}
                      step={5}
                      value={isoParams.verticalPosition}
                      onChange={(e) => setIsoParams(prev => ({ ...prev, verticalPosition: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-[#0F1117] rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <p className="text-[10px] text-slate-500 font-light mt-0.5">Hauteur verticale idéale ergonomique : ~75 cm (hauteur de hanche).</p>
                  </div>

                  {/* Horizontal reach distance from spine slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-medium font-sans">Distance horizontale du corps (cm)</span>
                      <span className="font-mono text-slate-400">{isoParams.horizontalDistance} cm</span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={63}
                      step={1}
                      value={isoParams.horizontalDistance}
                      onChange={(e) => setIsoParams(prev => ({ ...prev, horizontalDistance: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-[#0F1117] rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <p className="text-[10px] text-slate-500 font-light">Une distance élevée &gt; 35cm fatigue intensément le dos.</p>
                  </div>

                  {/* Vertical Travel distance */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Course verticale de déplacement (cm)</span>
                      <span className="font-mono text-slate-400">{isoParams.verticalDistance} cm</span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={180}
                      value={isoParams.verticalDistance}
                      onChange={(e) => setIsoParams(prev => ({ ...prev, verticalDistance: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-[#0F1117] rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Asymmetry torsion twist angle slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Angle de torsion du tronc (degrés)</span>
                      <span className="font-mono text-slate-400">{isoParams.asymmetryAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={135}
                      step={15}
                      value={isoParams.asymmetryAngle}
                      onChange={(e) => setIsoParams(prev => ({ ...prev, asymmetryAngle: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-[#0F1117] rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Lifting frequency */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Fréquence de levage (leves par minute)</span>
                      <span className="font-mono text-slate-400 font-bold">{isoParams.frequency} /min</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={15}
                      step={0.1}
                      value={isoParams.frequency}
                      onChange={(e) => setIsoParams(prev => ({ ...prev, frequency: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-[#0F1117] rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Duration of lifting task */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Durée quotidienne de manutention</span>
                      <span className="font-mono text-blue-400 font-bold">{isoParams.durationHours} h / jour</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={8}
                      step={0.5}
                      value={isoParams.durationHours}
                      onChange={(e) => setIsoParams(prev => ({ ...prev, durationHours: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-[#0F1117] rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <p className="text-[10px] text-slate-500 font-light">Durée réelle utilisée dans le Multiplicateur de Fréquence FM (tables NIOSH).</p>
                  </div>

                  {/* Hand grip coupling drop select */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider">Qualité de Prise / Poignée (Coupling)</label>
                    <select
                      value={isoParams.coupling}
                      onChange={(e) => setIsoParams(prev => ({ ...prev, coupling: e.target.value as "good" | "fair" | "poor" }))}
                      className="w-full bg-[#0F1117] border border-white/10 p-2.5 rounded-lg text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="good" className="bg-[#151921]">Excellente (poignées ergonomiques moulées)</option>
                      <option value="fair" className="bg-[#151921]">Acceptable / Moyenne (bords lisses de carton, sac épais)</option>
                      <option value="poor" className="bg-[#151921]">Mauvaise (pas de poignée, s'effrite, glissant)</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Reduction multipliers and speedometer dial view */}
              <div className="lg:col-span-2 space-y-6">
                
                {isoResult && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Gauge weight limit */}
                    <div className="bg-[#151921] p-6 rounded-xl border border-white/5 flex flex-col justify-between shadow-2xl relative">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[25px] rounded-full pointer-events-none"></div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Limite recommandée (LPR)</p>
                      <div className="my-3 text-center">
                        <span className="text-4xl font-extrabold text-white font-display">{isoResult.recommendedWeightLimit}</span>
                        <span className="text-sm font-medium text-slate-500 ml-1">kg</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Masse maximale recommandée à déplacer dans cette configuration géométrique précise.
                      </p>
                    </div>

                    {/* Gauge Lifting Index IL */}
                    <div className="bg-[#151921] p-6 rounded-xl border border-white/5 flex flex-col justify-between shadow-2xl relative">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Indice de Levage (IL)</p>
                      <div className="my-3 text-center">
                        <span className={`text-4xl font-extrabold font-display ${
                          isoResult.riskLevel === "low" ? "text-emerald-450" :
                          isoResult.riskLevel === "medium" ? "text-amber-450" :
                          "text-red-450"
                        }`}>{isoResult.liftingIndex}</span>
                      </div>
                      <span className={`text-[10px] py-1 px-3 rounded font-bold uppercase tracking-wider text-center border font-mono ${
                        isoResult.riskLevel === "low" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        isoResult.riskLevel === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse-once"
                      }`}>
                        {isoResult.riskLevel === "low" ? "Manutention Acceptable" :
                         isoResult.riskLevel === "medium" ? "Observation requise" :
                         "Action Corrective urgente !"}
                      </span>
                    </div>

                    {/* Workplace repetitive load info */}
                    <div className="bg-[#121620]/40 p-6 rounded-xl border border-white/5 text-xs text-slate-400 space-y-3 shadow-inner">
                      <p className="font-bold text-white uppercase tracking-wider font-mono text-[9px]">Norme Complète ISO 11228</p>
                      <div className="space-y-1.5 leading-relaxed">
                        <p>
                          <strong className="text-slate-300 font-sans">Partie 1 (Le levage) :</strong> Évaluée ici en fonction de la géométrie, des asymétries et des fréquences de manutention.
                        </p>
                        <p>
                          <strong className="text-slate-300 font-sans">Partie 2 (Le poussage) :</strong> Poussée continue de fûts ou plateaux, non applicable par défaut ou de façon dynamique.
                        </p>
                        <p>
                          <strong className="text-slate-300 font-sans">Partie 3 (Gestes répétitifs) :</strong>
                          <span className={activeWorkstation.physicalStrains.repetitiveWork ? "text-purple-400 font-bold" : "text-slate-500"}>
                            {activeWorkstation.physicalStrains.repetitiveWork ? " Activé : Exposition répétitive du canal carpien." : " Non actif."}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reduction Multipliers Breakdown Recharts Bar chart */}
                {isoResult && (
                  <div className="bg-[#151921] p-6 rounded-xl shadow-2xl border border-white/5 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Analyse des Facteurs de Réduction Ergonomiques</h4>
                      <p className="text-xs text-slate-400">Chaque facteur multiplie la masse de référence de départ. Une valeur proche de 1.0 montre une configuration optimale.</p>
                    </div>

                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: "Hauteur (VM)", value: isoResult.multipliers.vm, desc: "Hauteur verticale mains" },
                            { name: "Distance (HM)", value: isoResult.multipliers.hm, desc: "Portée horizontale dos" },
                            { name: "Course (DM)", value: isoResult.multipliers.dm, desc: "Déplacement vertical" },
                            { name: "Asymétrie (AM)", value: isoResult.multipliers.am, desc: "Torsion du torse" },
                            { name: "Fréquence (FM)", value: isoResult.multipliers.fm, desc: "Rythme de levage" },
                            { name: "Poignée (CM)", value: isoResult.multipliers.cm, desc: "Type de saisie physique" },
                          ]}
                          layout="vertical"
                          margin={{ top: 10, right: 10, left: 30, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                          <XAxis type="number" domain={[0, 1.0]} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0F1117', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} formatter={(value: any) => [`${(value * 100).toFixed(0)} %`, "Multiplicateur"]} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {
                              [
                                { name: "Hauteur (VM)", value: isoResult.multipliers.vm },
                                { name: "Distance (HM)", value: isoResult.multipliers.hm },
                                { name: "Course (DM)", value: isoResult.multipliers.dm },
                                { name: "Asymétrie (AM)", value: isoResult.multipliers.am },
                                { name: "Fréquence (FM)", value: isoResult.multipliers.fm },
                                { name: "Poignée (CM)", value: isoResult.multipliers.cm },
                              ].map((entry, index) => {
                                const val = Number(entry.value);
                                let color = "#10b981"; // good (emerald)
                                if (val < 0.5) color = "#ef4444"; // red
                                else if (val < 0.8) color = "#f59e0b"; // yellow
                                return <Cell key={`cell-${index}`} fill={color} />;
                              })
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-[#1c2433] border border-blue-500/10 p-4.5 rounded-lg text-xs flex items-start gap-2.5">
                      <Info className="w-5 h-5 text-blue-450 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-blue-400 font-mono text-[9px] uppercase tracking-wider">Conseils ergonomiques directs :</p>
                        <p className="text-slate-300 mt-1 leading-relaxed">
                          {isoResult.multipliers.hm < 0.7 && "⚠️ La distance horizontale est excessive. Rapprochez de force le poste ou déposez le fût directement sous le bras de l'opérateur. "}
                          {isoResult.multipliers.vm < 0.7 && "⚠️ La prise est située trop bas ou trop haut. Installez un élévateur hydraulique ou une table ergonomique à niveau réglable. "}
                          {isoResult.multipliers.am < 0.8 && "⚠️ Un mouvement rotatif de torsion du torse fatigue lourdement les lombaires. Réorganisez le poste pour un déplacement en ligne droite. "}
                          {isoResult.multipliers.fm < 0.6 && "⚠️ Fréquence excessive : proposez des pauses fréquentes ou intégrez de la commutation robotisée pour porter les sacs d'abrasifs."}
                          {isoResult.multipliers.cm < 0.95 && "⚠️ La prise difficile de la charge entraine des traumatismes musculaires. Fournissez des ventouses ou des bacs munis de poignées."}
                          {isoResult.riskLevel === "low" && "✅ La situation d'ergonomie actuelle présente un excellent profil de manutention acceptable."}
                        </p>
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Sliders for repetitive parameters */}
                <div className="bg-[#151921] p-6 rounded-xl shadow-2xl border border-white/5 space-y-5">
                  <div>
                    <h3 className="text-md font-bold text-white uppercase tracking-wider font-display">Variables Répétitivité ISO 11228-3</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Spécifiez l'intensité des gestes répétitifs des membres supérieurs d'après l'échelle de Borg et la méthode OCRA simplifiée.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs font-medium text-slate-400">
                    
                    {/* Frequency (Technical actions/min) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Fréquence des actions techniques</span>
                        <span className="font-mono text-[#3b82f6] font-bold">{repetitiveParams.technicalActionsPerMin} act / min</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={80}
                        step={1}
                        value={repetitiveParams.technicalActionsPerMin}
                        onChange={(e) => setRepetitiveParams(prev => ({ ...prev, technicalActionsPerMin: parseInt(e.target.value) }))}
                        className="w-full text-[#3b82f6] accent-[#3b82f6] cursor-pointer h-1.5 bg-[#0F1117] rounded-lg appearance-none"
                      />
                      <p className="text-[10px] text-slate-500 font-light">
                        Le haut niveau de vigilance commence au-delà de 30-40 actions techniques de la main par minute.
                      </p>
                    </div>

                    {/* Force rating on Borg scale */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Niveau d'effort perçu (Borg CR10)</span>
                        <span className="font-mono text-[#3b82f6] font-bold font-mono">CR10 : {repetitiveParams.forceBorgScale} / 10</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={0.5}
                        value={repetitiveParams.forceBorgScale}
                        onChange={(e) => setRepetitiveParams(prev => ({ ...prev, forceBorgScale: parseFloat(e.target.value) }))}
                        className="w-full text-[#3b82f6] accent-[#3b82f6] cursor-pointer h-1.5 bg-[#0F1117] rounded-lg appearance-none"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-light mt-0.5 font-mono">
                        <span>0: Nul</span>
                        <span>3: Modéré</span>
                        <span>5: Fort</span>
                        <span>10: Maximal</span>
                      </div>
                    </div>

                    {/* Posture awkwardness assessment */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider">Évaluation des postures (Membres Supérieurs)</label>
                      <select
                        value={repetitiveParams.postureScore}
                        onChange={(e) => setRepetitiveParams(prev => ({ ...prev, postureScore: e.target.value as "optimal" | "moderate" | "severe" }))}
                        className="w-full bg-[#0F1117] border border-white/10 p-2.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-[#3b82f6]"
                      >
                        <option value="optimal" className="bg-[#151921]">Optimale (angle neutre, pas d'extensions répétées)</option>
                        <option value="moderate" className="bg-[#151921]">Modérée (flexions/déviations régulières du poignet, bras tendu)</option>
                        <option value="severe" className="bg-[#151921]">Sévère (pince digitale constante, élévations répétées d'épaules)</option>
                      </select>
                    </div>

                    {/* Recovery deficit in hours */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Heures de travail continu sans récupération</span>
                        <span className="font-mono text-slate-400 font-mono">{repetitiveParams.recoveryDeficitHours} h</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={6}
                        step={1}
                        value={repetitiveParams.recoveryDeficitHours}
                        onChange={(e) => setRepetitiveParams(prev => ({ ...prev, recoveryDeficitHours: parseInt(e.target.value) }))}
                        className="w-full h-1.5 bg-[#0F1117] rounded-lg appearance-none cursor-pointer accent-[#3b82f6]"
                      />
                      <p className="text-[10px] text-slate-500 font-light mt-0.5">
                        Déficit : Heures cumulatives consécutives sans pause physiologique de 10 min par heure.
                      </p>
                    </div>

                    {/* Additional risk factors */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider">Facteurs de co-exposition aggravants</label>
                      <select
                        value={repetitiveParams.additionalFactors}
                        onChange={(e) => setRepetitiveParams(prev => ({ ...prev, additionalFactors: e.target.value as "none" | "few" | "multiple" }))}
                        className="w-full bg-[#0F1117] border border-white/10 p-2.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-[#3b82f6]"
                      >
                        <option value="none" className="bg-[#151921]">Aucun (environnement calme, outils suspendus)</option>
                        <option value="few" className="bg-[#151921]">Quelques-uns (gants de chantier épais OU froid &lt; 15°C)</option>
                        <option value="multiple" className="bg-[#151921]">Multiples (vibrations + froid ambiant intense + chocs répétés)</option>
                      </select>
                    </div>

                    {/* Cumulative daily repetitive session duration */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Durée totale cumulée par poste</span>
                        <span className="font-mono text-slate-400 font-bold font-mono">{repetitiveParams.durationHours} heures / jour</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={12}
                        step={1}
                        value={repetitiveParams.durationHours}
                        onChange={(e) => setRepetitiveParams(prev => ({ ...prev, durationHours: parseInt(e.target.value) }))}
                        className="w-full h-1.5 bg-[#0F1117] rounded-lg appearance-none cursor-pointer accent-[#3b82f6]"
                      />
                    </div>

                  </div>
                </div>

                {/* OCRA Repetitive Analysis and dashboard metrics */}
                <div className="lg:col-span-2 space-y-6">
                  {repetitiveResult && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* OCRA Score Indicator */}
                      <div className="bg-[#151921] p-6 rounded-xl border border-white/5 flex flex-col justify-between shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[25px] rounded-full pointer-events-none"></div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Indice OCRA (Check-list)</p>
                        <div className="my-3 text-center">
                          <span className={`text-4xl font-extrabold font-display ${
                            repetitiveResult.riskLevel === "low" ? "text-emerald-400" :
                            repetitiveResult.riskLevel === "medium" ? "text-amber-400" :
                            "text-red-400"
                          }`}>{repetitiveResult.ocraScore}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          Score calculé selon l'ISO 11228-3. Permet de statuer sur le risque d'apparition de TMS de l'épaule et de la main.
                        </p>
                      </div>

                      {/* Clinical evaluation badge */}
                      <div className="bg-[#151921] p-6 rounded-xl border border-white/5 flex flex-col justify-between shadow-2xl relative">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Appréciation clinique</p>
                        <div className="my-3 text-center">
                          <span className={`text-[11px] py-1.5 px-3 rounded font-bold uppercase tracking-wider text-center border font-mono block ${
                            repetitiveResult.ocraScore <= 7.5 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            repetitiveResult.ocraScore <= 11.0 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse-once"
                          }`}>
                            {repetitiveResult.ocraScore <= 7.5 ? "Risque Acceptable" :
                             repetitiveResult.ocraScore <= 11.0 ? "Risque Très Faible / Limite" :
                             "Risque Élevé !"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal text-center font-medium mt-1">
                          {repetitiveResult.riskLabel}
                        </p>
                      </div>

                      {/* Cumulative multipliers breakdown info */}
                      <div className="bg-[#121620]/40 p-6 rounded-xl border border-white/5 text-xs text-slate-400 space-y-3 shadow-inner">
                        <p className="font-bold text-white uppercase tracking-wider font-mono text-[9px]">Pénibilité & Multiplicateurs</p>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between border-b border-white/5 pb-1 font-mono">
                            <span className="text-slate-400">Facteur Récupération (RF):</span>
                            <span className="text-slate-300 font-bold">x {repetitiveResult.multipliers.recovery}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1 font-mono">
                            <span className="text-slate-400">Facteur Durée (DF):</span>
                            <span className="text-slate-300 font-bold">x {repetitiveResult.multipliers.duration}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal italic">
                            Un manque de pause ou une longue durée journalière multiplie le score de fatigue.
                          </p>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Recharts Bar Chart explaining contributors (Frequency, Force, Postures, Additional) */}
                  {repetitiveResult && (
                    <div className="bg-[#151921] p-6 rounded-xl shadow-2xl border border-white/5 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Répartition des Facteurs de Pénibilité (Bilan de Fatigue)</h4>
                        <p className="text-xs text-slate-400 font-medium">Cette contribution indique le poids de chaque paramètre de la tâche sur le score de base de congestion musculaire.</p>
                      </div>

                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: "Fréquence (CF)", value: repetitiveResult.contributions.frequency, desc: "Fréquence des gestes" },
                              { name: "Force (FF)", value: repetitiveResult.contributions.force, desc: "Effort musculaire" },
                              { name: "Postures (PF)", value: repetitiveResult.contributions.posture, desc: "Sollicitation articulaire" },
                              { name: "Co-facteurs (AF)", value: repetitiveResult.contributions.additional, desc: "Facteurs additionnels aggravants" },
                            ]}
                            layout="vertical"
                            margin={{ top: 10, right: 10, left: 30, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0F1117', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }} formatter={(value: any) => [`${value} pts`, "Intensité"]} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                              {
                                [
                                  { name: "Fréquence (CF)", value: repetitiveResult.contributions.frequency },
                                  { name: "Force (FF)", value: repetitiveResult.contributions.force },
                                  { name: "Postures (PF)", value: repetitiveResult.contributions.posture },
                                  { name: "Co-facteurs (AF)", value: repetitiveResult.contributions.additional },
                                ].map((entry, index) => {
                                  const val = Number(entry.value);
                                  let color = "#10b981"; // green
                                  if (val > 10) color = "#ef4444"; // red
                                  else if (val > 4) color = "#f59e0b"; // yellow
                                  return <Cell key={`cell-${index}`} fill={color} />;
                                })
                              }
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Advisory messages for repetitive tasks */}
                      <div className="bg-[#1c2433] border border-blue-500/10 p-4.5 rounded-lg text-xs flex items-start gap-2.5">
                        <Info className="w-5 h-5 text-blue-450 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-blue-400 font-mono text-[9px] uppercase tracking-wider">Avis médical et préventif personnalisé :</p>
                          <p className="text-slate-300 mt-1 leading-relaxed">
                            {repetitiveParams.technicalActionsPerMin >= 45 && "⚠️ Rythme de gestes trop rapide. Imposer une rotation de poste avec tâches non répétitives toutes les 2 heures. "}
                            {repetitiveParams.forceBorgScale >= 4 && "⚠️ L'effort demandé (Borg >= 4) excède les seuils physiologiques sécurisés pour les tendons de la main. Mettre en place des aides pneumatiques ou sangle d'assistance réglable. "}
                            {repetitiveParams.postureScore === "severe" && "⚠️ Contraintes articulaires extrêmes (ex: pince digitale, coudes levés). Re-designer l'espace de dépose ou adapter la hauteur du plan d'assemblage. "}
                            {repetitiveParams.recoveryDeficitHours >= 2 && "⚠️ Déficit de repos accumulé pour le système tendineux. Mettre en œuvre réglementairement 10 minutes d'arrêt toutes les 50 minutes d'actions continues. "}
                            {repetitiveParams.additionalFactors === "multiple" && "⚠️ Les conditions environnementales aggravent l'exposition articulaire (ex. froid ou vibrations). Fournir des gants isolants ou anti-vibratiles et un chauffage soufflant localisé. "}
                            {repetitiveResult.ocraScore <= 7.5 && "✅ Tâche de gestes répétitifs jugée sous contrôle. Le risque d'apparition de syndrome du canal carpien ou de ténosynovite est faible."}
                          </p>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* Tab 4: HEALTH SURVEILLANCE REPORT AND EXAMS (PRINT CARD VIEW) */}
        {activeTab === "report" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Report toolbar */}
            <div className="bg-[#151921] p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between border border-white/10 gap-4 shadow-xl print:hidden">
              <span className="text-xs text-slate-400 font-mono font-semibold uppercase tracking-wider">
                Prescription d'Évitement des Expositions & Auscultations
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={handleGenerateReport}
                  className="text-xs bg-[#0F1117] hover:bg-white/5 border border-white/10 text-slate-300 py-2.5 px-4 rounded flex items-center gap-1.5 font-bold font-mono uppercase tracking-wider transition transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                  <span>Rééditer le rapport</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(37,99,235,0.25)] cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Imprimer le Dossier</span>
                </button>
              </div>
            </div>

            {/* Simulated Medical Report Card (Designed like real INRS paper form) */}
            {reportData ? (
              <div className="bg-white border border-slate-300/80 p-8 md:p-12 rounded shadow-2xl space-y-8 text-slate-900 print:border-none print:shadow-none print:p-0">
                
                {/* Header Document */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                  <div className="space-y-1">
                    <p className="text-xs uppercase font-bold tracking-widest font-mono text-emerald-800">SERVICE DE PRÉVENTION ET DE SANTÉ AU TRAVAIL</p>
                    <h3 className="text-xl font-black text-slate-950 font-display">DOSSIER DE SYNTHÈSE DES RISQUES ET SURVEILLANCE DE SANTÉ</h3>
                    <p className="text-xs text-slate-500 font-mono">Renseigné pour l'Atelier actif le {new Date().toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono">
                    <p>Référence : INRS - BIOTOX / METROPOL</p>
                    <p>Assistance IA Google Gemini v3.5</p>
                    <p className="text-rose-600 font-bold">EXAMEN MÉDICAL REQUIS</p>
                  </div>
                </div>

                {/* Sub title Workstation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 border border-slate-205 rounded">
                  <div>
                    <h4 className="text-xs font-bold font-mono text-slate-500 uppercase">1. IDENTIFICATION ET POSTE</h4>
                    <p className="text-md font-bold text-slate-900 mt-1">{reportData.workstationName || activeWorkstation.name}</p>
                    {activeWorkstation.jobTitle && (
                      <p className="text-xs font-semibold text-blue-800 mt-0.5"><strong>Qualification / Poste occupé :</strong> {activeWorkstation.jobTitle}</p>
                    )}
                    <p className="text-xs text-slate-700 mt-1"><strong>Activité :</strong> {reportData.situation || activeWorkstation.situation}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-mono text-slate-500 uppercase">2. SURVEILLANCE ET PÉRIODICITÉ</h4>
                    <p className="text-md font-bold text-rose-800 mt-1">
                      Suivi Individuel Renforcé (SIR)
                    </p>
                    <p className="text-xs text-slate-700 mt-1"><strong>Fréquence de contrôle :</strong> TOUS LES {reportData.nextReviewMonths || 12} MOIS</p>
                  </div>
                </div>

                {/* Global Synthesis */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold font-mono text-slate-950 uppercase border-b border-slate-900 pb-1 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-emerald-800" />
                    3. SYNTHÈSE MÉDICALE ET SYNTHÈSE STATISTIQUE DE L'EXPOSITION
                  </h4>
                  <p className="text-sm text-slate-800 leading-relaxed font-serif italic text-justify pl-3 border-l-4 border-emerald-600">
                    "{reportData.globalSynthesis}"
                  </p>
                </div>

                {/* Detailed Chemical Table and Exams */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold font-mono text-slate-950 uppercase border-b border-slate-900 pb-1">
                    4. ANALYSE CHIMIQUE BAYÉSIENNE & EXAMENS BIOLOGIQUES REQUIS (BIOTOX)
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-700">
                          <th className="py-2 font-bold font-mono">Agent (CAS)</th>
                          <th className="py-2 font-bold font-mono">Diagnostic de Conformité (Bayésien)</th>
                          <th className="py-2 font-bold font-mono">Prélèvement d'Air (Métropol)</th>
                          <th className="py-2 font-bold font-mono">Dosages / Bio-surveillance Urinaire (BIOTOX)</th>
                          <th className="py-2 font-bold font-mono">Examens Médicaux Requis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        {reportData.chemicalsAnalyzed.map((chem, idx) => (
                          <tr key={idx} className="align-top">
                            <td className="py-3 font-semibold pr-4">
                              <span className="block text-slate-900">{chem.name}</span>
                              <span className="block text-[10px] text-slate-500 font-mono text-slate-500">CAS: {chem.cas}</span>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="text-slate-800 font-medium block">{chem.vlepCompliance}</span>
                              {bayesianResult && chem.name === selectedChemical?.name && (
                                <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase mt-1 ${
                                  bayesianResult.riskCategory === "green" ? "bg-emerald-100 text-emerald-800" :
                                  bayesianResult.riskCategory === "yellow" ? "bg-amber-100 text-amber-800" :
                                  "bg-rose-100 text-rose-800"
                                }`}>
                                  Action: {bayesianResult.riskCategory === "green" ? "Observation" : "Alerte de dépassement"}
                                </span>
                              )}
                            </td>
                            <td className="py-3 pr-4 font-mono text-slate-600 text-[11px] leading-tight" style={{ minWidth: '110px' }}>{chem.metropolMethod}</td>
                            <td className="py-3 pr-4 text-slate-700">
                              <span className="block font-medium">{chem.biotoxIndicator}</span>
                            </td>
                            <td className="py-3 text-slate-800">
                              <ul className="list-disc pl-4 space-y-1 text-slate-800">
                                {chem.requiredExams.map((ex, i) => (
                                  <li key={i}>{ex}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ISO 11228 Ergonomics Risks Block */}
                {reportData.ergonomicAnalyzed && reportData.ergonomicAnalyzed.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-mono text-slate-950 uppercase border-b border-slate-900 pb-1">
                      5. CONTRAINTES ERGONOMIQUES ET TROUBLES MUSCULOSQUELETTIQUES (ISO 11228-1)
                    </h4>
                    
                    {reportData.ergonomicAnalyzed.map((ergo, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-800 bg-slate-50 p-4 rounded border border-slate-200">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900">{ergo.type}</p>
                          <p className="text-rose-850 font-semibold text-rose-750">Indice de risque : {ergo.riskLevel}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-bold font-mono text-[9px] text-slate-500 uppercase">Observations cliniques & physiques :</p>
                          <p className="text-slate-700 leading-snug">{ergo.findings}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-bold font-mono text-[9px] text-slate-500 uppercase">Auscultations complémentaires obligatoires :</p>
                          <ul className="list-disc pl-4 space-y-1 text-slate-800">
                            {ergo.requiredExams.map((ex, i) => (
                              <li key={i}>{ex}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prevention Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold font-mono text-slate-950 uppercase border-b border-slate-900 pb-1">
                      6. PRÉVENTIONS TECHNIQUES ET COLLECTIVES
                    </h4>
                    <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-700">
                      {reportData.generalRecommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold font-mono text-slate-950 uppercase border-b border-slate-900 pb-1">
                      7. MOYENS D'ÉVICTION ET SIGNATURE DE VALIDITÉ
                    </h4>
                    <div className="p-4 bg-emerald-50 text-emerald-950 text-xs rounded border border-emerald-200 space-y-2 leading-relaxed">
                      <p>
                        <strong>Visa des médecins :</strong> Ce document fait foi de recommandation de médecine du travail. Les examens cités ci-dessus doivent être programmés avant l'affectation effective au poste de travail ou maintenus lors des contrôles périodiques annuels.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-[#151921] border border-white/5 p-12 text-center rounded-xl shadow-2xl space-y-4 max-w-lg mx-auto relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none select-none"></div>
                <FileCheck className="w-12 h-12 text-blue-500/60 mx-auto" />
                <div className="space-y-2 max-w-sm mx-auto">
                  <h4 className="text-md font-bold text-white uppercase tracking-wider font-display">Aucun rapport rédigé</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Cliquez sur le bouton "Générer Synthèse de Santé" ou analysez une nouvelle atmosphère FDS ci-dessus pour lancer la transcription et la rédaction assistée par l'IA des examens requis.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

      </main>

      {/* Footer information print none */}
      <footer className="bg-[#0F1117] border-t border-white/5 py-8 mt-12 print:hidden text-center text-xs text-slate-500 font-mono">
        <p>© 2026 Prévention HSE & Médecine du Travail — Propulsé par Google Gemini & Antigravity</p>
        <p className="text-[10px] mt-1 text-slate-600">Conforme aux référentiels français INRS BIOTOX, METROPOL et ISO 11228-1</p>
      </footer>
    </div>
  );
}
