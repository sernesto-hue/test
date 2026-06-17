/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { CompanyDatasheet, WorkingUnit, Workstation, HazardEvaluation, SafetyChemicalSheet, MedicalSurveillanceCategory } from "../types";
import { determineCategoryForWorkstation } from "../data/has_inrs_reference";
import { FileSpreadsheet, Search, Eye, Filter, ArrowUpDown, ChevronDown, CheckCircle2, ShieldAlert, Activity, HeartPulse, ExternalLink, Database, Wrench, Printer, Layers, Users } from "lucide-react";
import * as XLSX from "xlsx";

interface SurveillanceReportProps {
  company: CompanyDatasheet;
  units: WorkingUnit[];
  workstations: Workstation[];
  evaluations: HazardEvaluation[];
  fdsSheets: SafetyChemicalSheet[];
}

type SortField = "name" | "unit" | "category" | "employees";
type SortOrder = "asc" | "desc";

const getCleanBioLabel = (indexStr: string): string => {
  if (!indexStr) return "—";
  const str = indexStr.toLowerCase();
  
  if (str.includes("hexanedione") || str.includes("hexadione")) {
    return "2,5-Hexanedione (5 mg/L ou 0,5 mg/L libre)";
  }
  if (str.includes("méthanol") || str.includes("methanol")) {
    return "Méthanol (15 mg/L)";
  }
  if (str.includes("plomb")) {
    return "Plombémie (sanguine)";
  }
  if (str.includes("hippurique")) {
    return "Ac. Méthylhippurique (UR)";
  }
  
  // Try to match value/unit pattern like '5 mg/g' or '15 mg/L'
  const unitMatch = indexStr.match(/(\d+(?:\.\d+)?\s*(?:mg\/L|mg\/g(?:\s+de)?\s*créatinine|µg\/L))/i);
  if (unitMatch) {
    const unit = unitMatch[1];
    const sub = indexStr.split(/[:\(-]/)[0].trim().replace(/^(Dosage de la\s+|Dosage des\s+|Dosage du\s+)/i, "");
    const subCapitalized = sub.charAt(0).toUpperCase() + sub.slice(1);
    return `${subCapitalized} (${unit})`;
  }
  
  const words = indexStr.split(" ");
  if (words.length > 2) {
    return words.slice(0, 2).join(" ") + "...";
  }
  return indexStr;
};

export default function SurveillanceReport({
  company,
  units,
  workstations,
  evaluations,
  fdsSheets,
}: SurveillanceReportProps) {
  // Primary view: default to Grouping by Situation de travail COLLECTIVE (DUER / UT)
  const [viewMode, setViewMode] = useState<"unit" | "workstation">("unit");

  // Filters & Sorting state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Inspect detail popup state
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // 1. DYNAMIC COMPILATION OF OCCUPATIONAL HEALTH SURVEILLANCE
  const analyzedResults = useMemo(() => {
    if (workstations.length === 0) {
      return [];
    }

    if (viewMode === "unit") {
      const activeUnits = units.filter((u) => workstations.some((w) => w.unitId === u.id));
      return activeUnits.map((u) => {
        const unitWorkstations = workstations.filter((w) => w.unitId === u.id);
        const totalEmp = unitWorkstations.reduce((sum, w) => sum + (w.employeeCount || 0), 0);

        const aggregatedDemographics = {
          women: unitWorkstations.reduce((sum, w) => sum + (w.demographics?.women || 0), 0),
          men: unitWorkstations.reduce((sum, w) => sum + (w.demographics?.men || 0), 0),
          under18: unitWorkstations.reduce((sum, w) => sum + (w.demographics?.under18 || 0), 0),
          disabled: unitWorkstations.reduce((sum, w) => sum + (w.demographics?.disabled || 0), 0),
          nightWorker: unitWorkstations.reduce((sum, w) => sum + (w.demographics?.nightWorker || 0), 0)
        };

        const syntheticWorkstation = {
          id: `synth_${u.id}`,
          name: u.name,
          unitId: u.id,
          employeeCount: totalEmp,
          description: u.description,
          demographics: aggregatedDemographics
        };

        const surveillanceDetails = determineCategoryForWorkstation(syntheticWorkstation, evaluations, fdsSheets);

        // Extract specific high-priority risk sources for easy display
        const activeEvals = evaluations.filter((e) => e.unitId === u.id);
        const activeChemicals = fdsSheets.filter((f) => (f.exposedUnitIds && f.exposedUnitIds.includes(u.id)) || f.exposedWorkstationIds.length === 0);

        const dangerousExposures: string[] = [];
        if (aggregatedDemographics.nightWorker > 0) dangerousExposures.push("Travail de nuit");

        activeEvals.forEach((ev) => {
          const catLower = ev.category.toLowerCase();
          const dangerLower = ev.dangerSource.toLowerCase();

          if (catLower.includes("bruit")) {
            dangerousExposures.push(`Bruit (${ev.realRisk.toFixed(1)}/16)`);
          } else if (catLower.includes("rayonnement")) {
            dangerousExposures.push("Champs Électromagnétiques");
          } else if (catLower.includes("vibration")) {
            dangerousExposures.push("Vibrations physiques");
          } else if (catLower.includes("écran") || catLower.includes("ecran") || dangerLower.includes("écran") || dangerLower.includes("ecran")) {
            dangerousExposures.push("Travail sur écran");
          } else if (catLower.includes("ergonomie") || catLower.includes("posture") || catLower.includes("manuelle") || dangerLower.includes("posture") || dangerLower.includes("position") || dangerLower.includes("ergonomie")) {
            dangerousExposures.push("Ergonomie & Posture");
          } else if (catLower.includes("plain-pied") || catLower.includes("plain pied") || dangerLower.includes("plain-pied") || dangerLower.includes("plain pied") || catLower.includes("déplacement") || catLower.includes("gliss") || dangerLower.includes("encombrement")) {
            dangerousExposures.push("Chute de plain-pied");
          } else if (catLower.includes("hauteur") || dangerLower.includes("escalier") || dangerLower.includes("hauteur") || dangerLower.includes("échafaud") || dangerLower.includes("echafaud") || dangerLower.includes("nacelle")) {
            dangerousExposures.push("Chute de hauteur");
          } else if (catLower.includes("chimique") && !dangerLower.includes("soudage") && !dangerLower.includes("soude")) {
            if (!dangerousExposures.some((x) => x.startsWith("Risque chimique"))) {
              dangerousExposures.push("Risque chimique");
            }
          } else {
            const label = ev.category.charAt(0).toUpperCase() + ev.category.slice(1);
            dangerousExposures.push(label);
          }
        });

        activeChemicals.forEach((chem) => {
          const isCmr = chem.hazardPhrases.some((p) => p.startsWith("H350") || p.startsWith("H340") || p.startsWith("H360"));
          if (isCmr) {
            dangerousExposures.push(`CMR : ${chem.productName}`);
          } else if (chem.hazardPhrases.some((p) => p.startsWith("H361") || p.startsWith("H362"))) {
            dangerousExposures.push(`Reprotox : ${chem.productName}`);
          } else if (chem.hazardPhrases.some((p) => p.startsWith("H336"))) {
            dangerousExposures.push(`Solvant : ${chem.productName}`);
          }
        });

        const uniqueExposures = Array.from(new Set(dangerousExposures));

        if (uniqueExposures.length === 0) {
          uniqueExposures.push("Aucun facteur critique");
        }

        return {
          id: u.id,
          workstation: syntheticWorkstation,
          unitName: u.name,
          exposuresList: uniqueExposures,
          surveillanceCategory: surveillanceDetails.category,
          exams: surveillanceDetails.exams,
          biologicalIndices: surveillanceDetails.biologicalIndices,
          justifications: surveillanceDetails.justifications,
          vigilanceAlerts: surveillanceDetails.vigilanceAlerts || [],
          expertMethodologies: surveillanceDetails.expertMethodologies || [],
          databaseReferences: surveillanceDetails.databaseReferences || [],
        };
      });
    } else {
      return workstations.map((w) => {
        const unitObj = units.find((u) => u.id === w.unitId);
        const unitName = unitObj ? unitObj.name : "Non spécifié";
        
        const surveillanceDetails = determineCategoryForWorkstation(w, evaluations, fdsSheets);
        
        const activeEvals = evaluations.filter((e) => e.unitId === w.unitId && (e.exposedWorkstationIds.includes(w.id) || e.exposedWorkstationIds.length === 0));
        const activeChemicals = fdsSheets.filter((f) => f.exposedWorkstationIds.includes(w.id) || f.exposedWorkstationIds.length === 0);
        
        const dangerousExposures: string[] = [];
        if (w.demographics.nightWorker > 0) dangerousExposures.push("Travail de nuit");
        
        activeEvals.forEach((ev) => {
          const catLower = ev.category.toLowerCase();
          const dangerLower = ev.dangerSource.toLowerCase();

          if (catLower.includes("bruit")) {
            dangerousExposures.push(`Bruit (${ev.realRisk.toFixed(1)}/16)`);
          } else if (catLower.includes("rayonnement")) {
            dangerousExposures.push("Champs Électromagnétiques");
          } else if (catLower.includes("vibration")) {
            dangerousExposures.push("Vibrations physiques");
          } else if (catLower.includes("écran") || catLower.includes("ecran") || dangerLower.includes("écran") || dangerLower.includes("ecran")) {
            dangerousExposures.push("Travail sur écran");
          } else if (catLower.includes("ergonomie") || catLower.includes("posture") || catLower.includes("manuelle") || dangerLower.includes("posture") || dangerLower.includes("position") || dangerLower.includes("ergonomie")) {
            dangerousExposures.push("Ergonomie & Posture");
          } else if (catLower.includes("plain-pied") || catLower.includes("plain pied") || dangerLower.includes("plain-pied") || dangerLower.includes("plain pied") || catLower.includes("déplacement") || catLower.includes("gliss") || dangerLower.includes("encombrement")) {
            dangerousExposures.push("Chute de plain-pied");
          } else if (catLower.includes("hauteur") || dangerLower.includes("escalier") || dangerLower.includes("hauteur") || dangerLower.includes("échafaud") || dangerLower.includes("echafaud") || dangerLower.includes("nacelle")) {
            dangerousExposures.push("Chute de hauteur");
          } else if (catLower.includes("chimique") && !dangerLower.includes("soudage") && !dangerLower.includes("soude")) {
            if (!dangerousExposures.some((x) => x.startsWith("Risque chimique"))) {
              dangerousExposures.push("Risque chimique");
            }
          } else {
            const label = ev.category.charAt(0).toUpperCase() + ev.category.slice(1);
            dangerousExposures.push(label);
          }
        });

        activeChemicals.forEach((chem) => {
          const isCmr = chem.hazardPhrases.some((p) => p.startsWith("H350") || p.startsWith("H340") || p.startsWith("H360"));
          if (isCmr) {
            dangerousExposures.push(`CMR : ${chem.productName}`);
          } else if (chem.hazardPhrases.some((p) => p.startsWith("H361") || p.startsWith("H362"))) {
            dangerousExposures.push(`Reprotox : ${chem.productName}`);
          } else if (chem.hazardPhrases.some((p) => p.startsWith("H336"))) {
            dangerousExposures.push(`Solvant : ${chem.productName}`);
          }
        });

        const uniqueExposures = Array.from(new Set(dangerousExposures));

        if (uniqueExposures.length === 0) {
          uniqueExposures.push("Aucun facteur critique");
        }

        return {
          id: w.id,
          workstation: w,
          unitName,
          exposuresList: uniqueExposures,
          surveillanceCategory: surveillanceDetails.category,
          exams: surveillanceDetails.exams,
          biologicalIndices: surveillanceDetails.biologicalIndices,
          justifications: surveillanceDetails.justifications,
          vigilanceAlerts: surveillanceDetails.vigilanceAlerts || [],
          expertMethodologies: surveillanceDetails.expertMethodologies || [],
          databaseReferences: surveillanceDetails.databaseReferences || [],
        };
      });
    }
  }, [workstations, evaluations, fdsSheets, units, viewMode]);

  // Statistics
  const stats = useMemo(() => {
    let sig = 0, sia = 0, sir = 0;
    analyzedResults.forEach((r) => {
      const w = r.workstation;
      const count = w.employeeCount;
      if (r.surveillanceCategory === MedicalSurveillanceCategory.SIR) {
        sir += count;
      } else if (r.surveillanceCategory === MedicalSurveillanceCategory.SIA) {
        // Is there any workstation-wide exposure hazard in SIA?
        const hasSiaHazard = r.exposuresList.some((exp) => 
          exp.includes("Bruit") || 
          exp.includes("CEM") || 
          exp.includes("Champs") || 
          exp.includes("Vibrations") || 
          exp.includes("Solvant") || 
          exp.includes("Reprotox")
        );
        if (hasSiaHazard) {
          sia += count;
        } else {
          // Purely demographic SIA. Only count demographic employees in SIA, other in SIG!
          const d = w.demographics;
          const demSiaCount = Math.min(count, (d.disabled || 0) + (d.under18 || 0) + (d.nightWorker || 0));
          sia += demSiaCount;
          sig += (count - demSiaCount);
        }
      } else {
        sig += count;
      }
    });
    return { sig, sia, sir, total: sig + sia + sir };
  }, [analyzedResults]);

  // Apply sorting and searching
  const filteredResults = useMemo(() => {
    let list = [...analyzedResults];

    // Search query
    if (searchTerm.trim() !== "") {
      const query = searchTerm.toLowerCase();
      list = list.filter((r) => 
        r.workstation.name.toLowerCase().includes(query) ||
        r.unitName.toLowerCase().includes(query) ||
        r.exposuresList.some((e) => e.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      list = list.filter((r) => r.surveillanceCategory === categoryFilter);
    }

    // Unit filter (Only applicable in workstation view, or when unitFilter is selected)
    if (unitFilter !== "all") {
      list = list.filter((r) => r.workstation.unitId === unitFilter);
    }

    // Advanced interactive sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.workstation.name.localeCompare(b.workstation.name);
      } else if (sortField === "unit") {
        comparison = a.unitName.localeCompare(b.unitName);
      } else if (sortField === "category") {
        const severityMap = {
          [MedicalSurveillanceCategory.SIG]: 1,
          [MedicalSurveillanceCategory.SIA]: 2,
          [MedicalSurveillanceCategory.SIR]: 3
        };
        comparison = severityMap[a.surveillanceCategory] - severityMap[b.surveillanceCategory];
      } else if (sortField === "employees") {
        comparison = a.workstation.employeeCount - b.workstation.employeeCount;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return list;
  }, [analyzedResults, searchTerm, categoryFilter, unitFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // EXCEL EXPORTER using the xlsx package we installed (SheetJS)
  const handleExportExcel = () => {
    const dataToExport = analyzedResults.map((r, index) => {
      const d = r.workstation.demographics;
      return {
        "N°": index + 1,
        "Situation collective (UT) ou Poste": r.workstation.name,
        "Type d'évaluation": viewMode === "unit" ? "Situation Collective (UT / DUER)" : "Poste Individuel",
        "Salariés rattachés": r.workstation.employeeCount,
        "Facteurs de risques identifiés": r.exposuresList.join(", "),
        "Catégorie Suivi Médical (HAS)": r.surveillanceCategory,
        "Examens cliniques préconisés (HAS)": r.exams.length > 0 ? r.exams.join(" | ") : "Surveillance paraclinique standard",
        "Bio-toxicologie / IBE recommandés (INRS)": r.biologicalIndices.length > 0 ? r.biologicalIndices.join(" | ") : "Pas de bio-monitoring chimique requis",
        "Justifications médico-légales": r.justifications.join(" // ")
      };
    });

    // Create Sheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    
    // Set column width for optimal layout opening in Excel
    const wscols = [
      { wch: 5 },   // N°
      { wch: 35 },  // Situation / Poste
      { wch: 25 },  // Type
      { wch: 15 },  // Salaries
      { wch: 35 },  // Facteurs
      { wch: 20 },  // Categorie
      { wch: 45 },  // Examens
      { wch: 40 },  // IBE
      { wch: 60 }   // Justifications
    ];
    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Surveillance Préventive");

    // File name based on establishment
    const fileName = `Surveillance_Sante_${company.name.replace(/\s+/g, "_")}_2026.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getCategoryBadgeClass = (cat: MedicalSurveillanceCategory) => {
    switch (cat) {
      case MedicalSurveillanceCategory.SIG:
        return "bg-green-600 text-white rounded-full text-[10px] font-bold px-2 py-0.5 border-transparent shadow-xs";
      case MedicalSurveillanceCategory.SIA:
        return "bg-amber-500 text-white rounded-full text-[10px] font-bold px-2 py-0.5 border-transparent shadow-xs";
      case MedicalSurveillanceCategory.SIR:
        return "bg-red-600 text-white rounded-full text-[10px] font-bold px-2 py-0.5 border-transparent shadow-xs";
    }
  };

  const selectedResult = analyzedResults.find((r) => r.id === selectedResultId);

  return (
    <div className="space-y-4 text-slate-800" id="report-surveillance-container">
      {/* Company Summary Card - High Density style */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-6 md:gap-8">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Établissement Actuel</p>
            <h2 className="text-base font-bold text-slate-900">{company.name}</h2>
            <p className="text-[11px] text-slate-500 font-mono">SIRET: {company.siret || "N/A"} | Activité: {company.activitySector}</p>
          </div>
          <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-8">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Effectif Global</p>
            <p className="text-base font-bold text-slate-900">{stats.total} Salariés</p>
            <p className="text-[11px] text-indigo-755 font-bold text-indigo-600">
              {stats.sir} SIR (Renforcé) | {stats.sia} SIA (Adapté) | {stats.sig} SIG (Général)
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto shrink-0 no-print">
          <button
            onClick={handleExportExcel}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer bg-white"
            id="btn-export-excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Exporter vers Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded text-xs font-bold shadow-xs transition cursor-pointer"
            id="btn-export-pdf"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {/* 1.1 VIEW MODE TOGGLE (COLLECTIVE DUER VS INDIVIDUAL POSTES) - Responsive Tabs */}
      <div className="flex bg-slate-100 rounded-lg p-1 max-w-lg border border-slate-200 shadow-3xs mb-1.5 no-print">
        <button
          onClick={() => {
            setViewMode("unit");
            setSelectedResultId(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
            viewMode === "unit"
              ? "bg-white text-teal-700 shadow-xs border border-slate-200/50"
              : "text-slate-500 hover:text-slate-800"
          }`}
          id="btn-view-unit-collective"
        >
          <Layers className="w-3.5 h-3.5 text-teal-600" />
          <span>Situations Collectives (DUER / UT)</span>
        </button>
        <button
          onClick={() => {
            setViewMode("workstation");
            setSelectedResultId(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
            viewMode === "workstation"
              ? "bg-white text-indigo-700 shadow-xs border border-slate-200/50"
              : "text-slate-500 hover:text-slate-800"
          }`}
          id="btn-view-workstation-individual"
        >
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span>Fiches de Poste (Individuel)</span>
        </button>
      </div>

      {/* FILTER CONTROLS GRID - Tight spacing */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-3 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher situation, danger, substance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded py-1 pl-8 pr-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* UT Filter dropdown */}
          {viewMode === "workstation" && (
            <div className="flex items-center gap-1 w-full md:w-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight shrink-0">Filtrer par UT:</span>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              >
                <option value="all">Siri-tout</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Medical Tracker filter dropdown */}
          <div className="flex items-center gap-1 w-full md:w-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight shrink-0">Catégorie Suivi:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
            >
              <option value="all">Tout</option>
              <option value={MedicalSurveillanceCategory.SIG}>Général (SIG)</option>
              <option value={MedicalSurveillanceCategory.SIA}>Adapté (SIA)</option>
              <option value={MedicalSurveillanceCategory.SIR}>Renforcé (SIR)</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] font-bold text-slate-500 hidden lg:block font-mono">
          Moteur : <span className="text-blue-600">INRS Biotox + ACGIH 2025</span>
        </div>
      </div>

      {/* MAIN DATA TABLE WITH HIGH DENSITY INTERACTION */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] uppercase text-slate-500 font-mono">
                <th
                  onClick={() => toggleSort("name")}
                  className="px-4 py-2.5 font-bold cursor-pointer hover:bg-slate-100 transition-colors w-72"
                >
                  <div className="flex items-center gap-1">
                    {viewMode === "unit" ? "Situation collective de travail (UT / DUER)" : "Fiche de Poste Individuelle"} 
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("unit")}
                  className="px-4 py-2.5 font-bold cursor-pointer hover:bg-slate-100 transition-colors w-40"
                >
                  <div className="flex items-center gap-1">
                    Cadre d'analyse <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("employees")}
                  className="px-4 py-2.5 font-bold cursor-pointer hover:bg-slate-100 transition-colors text-center w-28"
                >
                  <div className="flex items-center gap-1 justify-center">
                    Effectif (F/H) <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-2.5 font-bold">Risques Principaux Detectés</th>
                <th className="px-4 py-2.5 font-bold w-32 text-center">Suivi Médical</th>
                <th className="px-4 py-2.5 font-bold">Examens Facultatifs/Obligatoires</th>
                <th className="px-4 py-2.5 font-bold">Biotoxicologie (IBE)</th>
                <th className="px-4 py-2.5 font-bold w-12 text-center">Détail</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 italic font-medium">
                    {viewMode === "unit" 
                      ? "Aucun poste de travail n'étant renseigné, le suivi médical reste vide (pas d'extrapolation d'information sans élément véridique ni fiche de poste)."
                      : "Aucun poste de travail n'étant renseigné, la surveillance individuelle reste vide (pas d'extrapolation d'information sans élément de poste de travail véridique)."}
                  </td>
                </tr>
              ) : (
                filteredResults.map((item) => {
                  const d = item.workstation.demographics;
                  const catClass = getCategoryBadgeClass(item.surveillanceCategory);

                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 group transition-colors">
                      {/* Name */}
                      <td className="px-4 py-2.5 font-bold text-slate-950">
                        {item.workstation.name}
                      </td>

                      {/* Unit */}
                      <td className="px-4 py-2.5 text-slate-500 font-medium">
                        {viewMode === "unit" ? "Évaluation Collective DUER" : item.unitName}
                      </td>

                      {/* Headcount */}
                      <td className="px-4 py-2.5 text-center font-semibold text-slate-900 font-mono">
                        {item.workstation.employeeCount} salariés {(d.women > 0 || d.men > 0) && `(${d.women}F/${d.men}H)`}
                      </td>

                      {/* Identified risks list */}
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {item.exposuresList.map((exp, idx) => {
                            const isSevere = exp.startsWith("CMR") || exp.includes("Amiante") || exp.includes("Bruit (") || exp.includes("Hauteur");
                            return (
                              <span
                                key={idx}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isSevere 
                                    ? "bg-rose-50 text-rose-700 border border-rose-100" 
                                    : "bg-slate-50 text-slate-600 border border-slate-150"
                                }`}
                              >
                                {exp}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-4 py-2.5 text-center">
                        <span className={catClass}>{item.surveillanceCategory}</span>
                      </td>

                      {/* Recommended Clinical Exams */}
                      <td className="px-4 py-2.5 text-slate-600">
                        {item.exams.length > 0 ? (
                          <ul className="list-disc pl-3 space-y-0.5">
                            {item.exams.slice(0, 3).map((ex, idx) => (
                              <li key={idx} className="line-clamp-1 leading-normal text-[11px] font-medium">{ex}</li>
                            ))}
                            {item.exams.length > 3 && (
                              <li className="text-[10px] text-blue-600 font-bold list-none">+{item.exams.length - 3} examens recommandés</li>
                            )}
                          </ul>
                        ) : (
                          <span className="text-slate-400 italic">VIP standard périodique (5 ans)</span>
                        )}
                      </td>

                      {/* Biological Monitoring */}
                      <td className="px-4 py-2.5 text-slate-600 font-mono">
                        {item.biologicalIndices.length > 0 ? (
                          <div className="space-y-0.5">
                            {item.biologicalIndices.slice(0, 2).map((bio, idx) => (
                              <div key={idx} className="text-[10px] text-purple-700 bg-purple-50/50 border border-purple-100 rounded px-1.5 py-0.5 leading-tight line-clamp-1">
                                {getCleanBioLabel(bio)}
                              </div>
                            ))}
                            {item.biologicalIndices.length > 2 && (
                              <div className="text-[9px] text-purple-600 font-bold">+{item.biologicalIndices.length - 2} indices bio-tox</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-350 italic">—</span>
                        )}
                      </td>

                      {/* View Single card details */}
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => setSelectedResultId(item.id)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                          title="Fiche individuelle détaillée"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RICH FLOATING CARD DETAIL VIEW - MODAL POPUP */}
      {selectedResult && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 max-h-[85vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-150 pb-3">
              <div>
                <span className={getCategoryBadgeClass(selectedResult.surveillanceCategory)}>
                  Suivi Préventif {selectedResult.surveillanceCategory}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-emerald-600" />
                  {selectedResult.workstation.name}
                </h3>
                <p className="text-xs text-slate-400 block font-medium">
                  {viewMode === "unit" ? "Situation collective de travail classée" : `Poste rattaché à : ${selectedResult.unitName}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedResultId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Demographics details */}
            <div className="bg-slate-55 bg-slate-50 border border-slate-150 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight block">Salariés Total</span>
                <span className="font-extrabold text-slate-900 text-sm">{selectedResult.workstation.employeeCount} personnes</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight block">Démographie (F/H)</span>
                <span className="font-bold text-slate-800">{selectedResult.workstation.demographics.women} Femmes / {selectedResult.workstation.demographics.men} Hommes</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight block">Salariés de nuit</span>
                <span className="font-bold text-slate-800">{selectedResult.workstation.demographics.nightWorker} affectés</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight block">Spécificités (-18 ans / RQTH)</span>
                <span className="font-bold text-slate-800">
                  {selectedResult.workstation.demographics.under18} Mineurs • {selectedResult.workstation.demographics.disabled} RQTH
                </span>
              </div>
            </div>

            {/* Justifications list */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Motifs juridiques et médicaux d'orientation (HAS / Légifrance)
              </span>
              <div className="space-y-1.5">
                {selectedResult.justifications.map((just, idx) => (
                  <div key={idx} className="text-xs bg-slate-50 border-l-2 border-indigo-500 p-2 text-slate-700 leading-normal font-medium">
                    {just}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Clinical Exams lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  Examens Cliniques Orientés (HAS)
                </span>
                {selectedResult.exams.length > 0 ? (
                  <ul className="text-xs space-y-1.5 bg-blue-50/20 border border-blue-100 p-3 rounded-lg divide-y divide-blue-50">
                    {selectedResult.exams.map((ex, idx) => (
                      <li key={idx} className="pt-1.5 first:pt-0 leading-normal font-medium text-slate-700">
                        {ex}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">Surveillance clinique générale VIP périodique standard uniquement.</p>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                  Indices Biologiques d'Exposition (IBE / Biotox)
                </span>
                {selectedResult.biologicalIndices.length > 0 ? (
                  <div className="text-xs space-y-1.5 bg-purple-50/25 border border-purple-100 p-3 rounded-lg">
                    {selectedResult.biologicalIndices.map((bio, idx) => (
                      <div key={idx} className="p-2 bg-white border border-purple-50 rounded shadow-3xs text-purple-900 leading-tight font-medium font-mono">
                        {bio}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">Pas d'obligation légale de dosage de biotoxicologie relevée sur ce descriptif.</p>
                )}
              </div>
            </div>

            {/* Vigilance safety warnings & alerts */}
            {selectedResult.vigilanceAlerts && selectedResult.vigilanceAlerts.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-850 text-amber-700 uppercase tracking-wider block flex items-center gap-1">
                  💡 Recommandations et points de vigilance de prévention
                </span>
                <div className="bg-amber-50 border border-amber-150 rounded-lg p-3 text-xs text-amber-800 space-y-1">
                  {selectedResult.vigilanceAlerts.map((alert, idx) => (
                    <div key={idx} className="leading-normal font-medium flex items-start gap-1.5">
                      <span className="text-[10px] mt-1 shrink-0">•</span>
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scientific method and regulations bibliography */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase block flex items-center gap-1 font-mono">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Références Réglementaires & Bibliographie scientifique de prévention
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                {selectedResult.databaseReferences.map((refItem, idx) => (
                  <a
                    key={idx}
                    href={refItem.url}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="p-2 border border-slate-150 rounded hover:border-slate-350 hover:bg-slate-50 transition-all block space-y-0.5"
                  >
                    <div className="font-bold text-slate-800 flex justify-between items-center">
                      <span className="line-clamp-1">{refItem.label}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                    </div>
                    <p className="text-slate-500 font-mono">Régulateur : {refItem.source}</p>
                    <p className="text-slate-600 line-clamp-2 leading-relaxed italic">{refItem.details}</p>
                  </a>
                ))}
              </div>
            </div>

            {/* Modal foot actions */}
            <div className="flex justify-end pt-3 border-t border-slate-150">
              <button
                onClick={() => setSelectedResultId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
