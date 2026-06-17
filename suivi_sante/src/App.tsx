/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CompanyDatasheet, WorkingUnit, Workstation, HazardEvaluation, SafetyChemicalSheet } from "./types";
import { MOCK_COMPANY, MOCK_UNITS, MOCK_WORKSTATIONS, MOCK_EVALUATIONS, MOCK_FDS } from "./data/mock_company";
import CompanyForm from "./components/CompanyForm";
import DUERPManager from "./components/DUERPManager";
import FDSManager from "./components/FDSManager";
import WorkstationsManager from "./components/WorkstationsManager";
import SurveillanceReport from "./components/SurveillanceReport";
import DataImporter from "./components/DataImporter";
import LibraryManager from "./components/LibraryManager";
import { Building2, ShieldAlert, FlaskConical, HeartPulse, RefreshCw, Layers, Upload, AlertTriangle, X, BookOpen, Users } from "lucide-react";

const BLANK_COMPANY: CompanyDatasheet = {
  id: "c_vierge",
  name: "Nouvel Établissement",
  siret: "",
  address: "",
  contactName: "",
  contactEmail: "",
  activitySector: "",
  year: new Date().getFullYear(),
  description: "Établissement vierge. Veuillez configurer manuellement ou importer votre DUEP ou vos fiches de sécurité."
};

export default function App() {
  // 1. STATE INITIALIZATION (Local Storage first, fallback to completely empty/virgin structures)
  const [company, setCompany] = useState<CompanyDatasheet>(() => {
    const saved = localStorage.getItem("medprev_company");
    return saved ? JSON.parse(saved) : BLANK_COMPANY;
  });

  const [units, setUnits] = useState<WorkingUnit[]>(() => {
    const saved = localStorage.getItem("medprev_units");
    return saved ? JSON.parse(saved) : [];
  });

  const [workstations, setWorkstations] = useState<Workstation[]>(() => {
    const saved = localStorage.getItem("medprev_workstations");
    return saved ? JSON.parse(saved) : [];
  });

  const [evaluations, setEvaluations] = useState<HazardEvaluation[]>(() => {
    const saved = localStorage.getItem("medprev_evaluations");
    return saved ? JSON.parse(saved) : [];
  });

  const [fdsSheets, setFdsSheets] = useState<SafetyChemicalSheet[]>(() => {
    const saved = localStorage.getItem("medprev_fdsSheets");
    return saved ? JSON.parse(saved) : [];
  });

  // Banner status for Koshi demo warning
  const [dismissedBanner, setDismissedBanner] = useState(() => {
    return localStorage.getItem("medprev_dismiss_banner") === "true";
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<"company" | "duerp" | "fds" | "workstations" | "surveillance" | "library">("surveillance");

  // Custom confirmation and import modal states (avoids blocking confirm() calls)
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 2. EFFECT: WRITE TO LOCAL STORAGE ON STATE CHANGE
  useEffect(() => {
    localStorage.setItem("medprev_company", JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem("medprev_units", JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem("medprev_workstations", JSON.stringify(workstations));
  }, [workstations]);

  useEffect(() => {
    localStorage.setItem("medprev_evaluations", JSON.stringify(evaluations));
  }, [evaluations]);

  useEffect(() => {
    localStorage.setItem("medprev_fdsSheets", JSON.stringify(fdsSheets));
  }, [fdsSheets]);

  // Performs safe reset to Demo
  const handlePerformResetDemo = () => {
    setCompany(MOCK_COMPANY);
    setUnits(MOCK_UNITS);
    setWorkstations(MOCK_WORKSTATIONS);
    setEvaluations(MOCK_EVALUATIONS);
    setFdsSheets(MOCK_FDS);
    setActiveTab("surveillance");
    setShowResetConfirm(false);
    setDismissedBanner(false);
    localStorage.removeItem("medprev_dismiss_banner");
  };

  // Performs absolute clear for clean import workbench
  const handlePerformClearAll = () => {
    setCompany({
      id: `c_empty_${Date.now()}`,
      name: "Nouvel Établissement",
      siret: "",
      address: "",
      contactName: "",
      contactEmail: "",
      activitySector: "Secteur d'activité",
      year: new Date().getFullYear(),
      description: "Nouveau dossier médical d'entreprise généré par l'Atelier d'Importation."
    });
    setUnits([]);
    setWorkstations([]);
    setEvaluations([]);
    setFdsSheets([]);
    setActiveTab("company");
    setShowResetConfirm(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-12">
      {/* GLOBAL HIGH-DENSITY WHITE HEADER */}
      <header className="bg-white border-b border-slate-200 shadow-xs z-10 sticky top-0 no-print" id="main-application-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm" id="app-logo-box">
              M
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-800 leading-tight">
                MedWork <span className="text-blue-600">Occupational Health</span>
              </h1>
              <p className="text-[10px] text-slate-500 leading-tight font-mono">
                Suivi et Surveillance de Santé au Travail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-right hidden md:block">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold leading-none">Établissement actif</span>
              <span className="text-xs font-bold text-blue-700">{company.name} ({company.siret || "Sans SIRET"})</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 text-[10px] font-bold mr-1">
                <span className="text-slate-400 uppercase font-mono">Referentiel:</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100 uppercase tracking-wider font-mono text-[9px]">INRS / HAS 2024</span>
              </div>

              {/* UPLOADER / IMPORTER AT THE HEADER LEVEL */}
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase font-mono font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs border border-transparent transition-all"
                id="btn-global-import"
                title="Importer des données Excel, CSV ou JSON"
              >
                <Upload className="w-3.5 h-3.5" /> Importer / Fichiers
              </button>

              {/* DETACHED SAFE RESET TRIGGER */}
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded border border-slate-300 shadow-xs transition"
                id="btn-app-reset"
                title="Réinitialiser l'application avec le jeu de données démo"
              >
                <RefreshCw className="w-3 h-3 text-slate-500" /> Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* COOPERATIVE MOCK DATA DETECTION HELP BANNER */}
      {!dismissedBanner && company.name === "SERAM INDUSTRIES" && (
        <div className="bg-amber-50 border-b border-amber-200 py-3 px-4 sm:px-6 lg:px-8 text-amber-900" id="demo-mode-alert-banner">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex gap-2.5 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-relaxed">
                <span className="font-extrabold text-amber-950">Mode de démonstration actif :</span> Vous visualisez actuellement les données extraites du document de <span className="font-extrabold text-amber-950">SERAM INDUSTRIES</span>. Pour travailler sur un registre complètement vierge et y importer vos propres fichiers (PDF, Excel, FDS), videz les anciennes données en un clic :
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch md:self-auto justify-end sm:justify-start shrink-0">
              <button
                type="button"
                onClick={() => {
                  handlePerformClearAll();
                  setDismissedBanner(true);
                  localStorage.setItem("medprev_dismiss_banner", "true");
                }}
                className="bg-slate-900 hover:bg-black text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition shadow hover:shadow-md cursor-pointer whitespace-nowrap"
              >
                🧹 Vider et Commencer Vierge
              </button>
              <button
                type="button"
                onClick={() => {
                  setDismissedBanner(true);
                  localStorage.setItem("medprev_dismiss_banner", "true");
                }}
                className="text-amber-800 hover:text-amber-950 font-bold text-[10px] uppercase tracking-wider bg-amber-100 hover:bg-amber-200 border border-amber-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap"
              >
                Masquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABS CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Navigation Tabs bar - Compact Dark Sidebar/Tabs Accent */}
        <div className="flex bg-slate-900 rounded p-1 border border-slate-800 shadow-sm mb-4 overflow-x-auto gap-0.5 no-print" id="navigation-tabs-bar">
          <button
            onClick={() => setActiveTab("surveillance")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-all whitespace-nowrap ${
              activeTab === "surveillance"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" /> Surveillance de Santé
          </button>
          <button
            onClick={() => setActiveTab("company")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-all whitespace-nowrap ${
              activeTab === "company"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Fiche Entreprise
          </button>
          <button
            onClick={() => setActiveTab("duerp")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-all whitespace-nowrap ${
              activeTab === "duerp"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Document Unique (DUER)
          </button>
          <button
            onClick={() => setActiveTab("fds")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-all whitespace-nowrap ${
              activeTab === "fds"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" /> Fiches Sécurité (FDS)
          </button>
          <button
            onClick={() => setActiveTab("workstations")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-all whitespace-nowrap ${
              activeTab === "workstations"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Fiches de Poste
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded transition-all whitespace-nowrap ${
              activeTab === "library"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Bibliothèque / Références
          </button>
        </div>

        {/* ACTIVE TABS DISPATCH */}
        <div className="transition-all duration-300" id="dispatch-view-port">
          {activeTab === "company" && (
            <CompanyForm
              company={company}
              setCompany={setCompany}
              units={units}
              setUnits={setUnits}
              workstations={workstations}
            />
          )}

          {activeTab === "duerp" && (
            <DUERPManager
              evaluations={evaluations}
              setEvaluations={setEvaluations}
              units={units}
              workstations={workstations}
            />
          )}

          {activeTab === "fds" && (
            <FDSManager
              fdsSheets={fdsSheets}
              setFdsSheets={setFdsSheets}
              workstations={workstations}
              units={units}
            />
          )}

          {activeTab === "workstations" && (
            <WorkstationsManager
              workstations={workstations}
              setWorkstations={setWorkstations}
              units={units}
              setUnits={setUnits}
            />
          )}

          {activeTab === "library" && (
            <LibraryManager />
          )}

          {activeTab === "surveillance" && (
            <SurveillanceReport
              company={company}
              units={units}
              workstations={workstations}
              evaluations={evaluations}
              fdsSheets={fdsSheets}
            />
          )}
        </div>
      </main>

      {/* RICH DATA IMPORTER COMPONENT MODAL */}
      <DataImporter
        company={company}
        setCompany={setCompany}
        units={units}
        setUnits={setUnits}
        workstations={workstations}
        setWorkstations={setWorkstations}
        evaluations={evaluations}
        setEvaluations={setEvaluations}
        fdsSheets={fdsSheets}
        setFdsSheets={setFdsSheets}
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      {/* REUSABLE CUSTOM THEMED OVERLAY CONFIRM DIALOG FOR GENERAL APPLICATION RESET */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" id="reset-modal-overlay">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-200 text-slate-800 flex flex-col gap-4">
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-extrabold text-slate-900">Options de Réinitialisation</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Choisissez comment vous souhaitez réinitialiser l'application. Cette action écrasera vos données locales actuelles.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-2">
              <button
                type="button"
                onClick={handlePerformClearAll}
                className="w-full bg-slate-900 hover:bg-black text-white p-3 rounded-lg text-left text-xs transition border border-transparent shadow-xs"
              >
                <div className="font-extrabold">1. Commencer avec un Registre VIERGE</div>
                <div className="text-[10px] text-slate-300 font-medium mt-0.5">Efface tout pour pouvoir importer vos propres fichiers (PDF, Excel).</div>
              </button>

              <button
                type="button"
                onClick={handlePerformResetDemo}
                className="w-full bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-900 p-3 rounded-lg text-left text-xs transition shadow-xs"
              >
                <div className="font-extrabold">2. Restaurer les données de DÉMO</div>
                <div className="text-[10px] text-blue-700 font-medium mt-0.5">Recharge les données de SERAM INDUSTRIES issues du document pour explorer les fonctionnalités de l'outil.</div>
              </button>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition shadow-xs"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

