/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Workstation, WorkingUnit } from "../types";
import { 
  Users, Plus, Trash2, Edit2, Check, X, Sparkles, FileText, 
  HelpCircle, AlertTriangle, ArrowRight, UserCheck, Eye, Loader2 
} from "lucide-react";

interface WorkstationsManagerProps {
  workstations: Workstation[];
  setWorkstations: React.Dispatch<React.SetStateAction<Workstation[]>>;
  units: WorkingUnit[];
  setUnits: React.Dispatch<React.SetStateAction<WorkingUnit[]>>;
}

export default function WorkstationsManager({
  workstations,
  setWorkstations,
  units,
  setUnits,
}: WorkstationsManagerProps) {
  // Navigation inside workstations tab (List vs. New Fiche de poste analyze)
  const [showForm, setShowForm] = useState(false);
  const [editingW, setEditingW] = useState<Workstation | null>(null);
  const [deleteWConfirmId, setDeleteWConfirmId] = useState<string | null>(null);

  // Manual input form states
  const [wName, setWName] = useState("");
  const [wUnitId, setWUnitId] = useState("");
  const [wDesc, setWDesc] = useState("");
  const [wWomen, setWWomen] = useState(0);
  const [wMen, setWMen] = useState(0);
  const [wUnder18, setWUnder18] = useState(0);
  const [wDisabled, setWDisabled] = useState(0);
  const [wNightWorker, setWNightWorker] = useState(0);

  // Copied Job description text area states
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuccessMessage, setAiSuccessMessage] = useState("");

  const handleOpenNewW = () => {
    setEditingW(null);
    setWName("");
    setWUnitId(units.length > 0 ? units[0].id : "");
    setWDesc("");
    setWWomen(0);
    setWMen(0);
    setWUnder18(0);
    setWDisabled(0);
    setWNightWorker(0);
    setAiError("");
    setAiSuccessMessage("");
    setShowForm(true);
  };

  const openEditW = (w: Workstation) => {
    setEditingW(w);
    setWName(w.name);
    setWUnitId(w.unitId);
    setWDesc(w.description);
    setWWomen(w.demographics.women);
    setWMen(w.demographics.men);
    setWUnder18(w.demographics.under18);
    setWDisabled(w.demographics.disabled);
    setWNightWorker(w.demographics.nightWorker);
    setAiError("");
    setAiSuccessMessage("");
    setShowForm(true);
  };

  const handleAddOrEditWorkstation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wName.trim()) {
      alert("Veuillez saisir un intitulé pour le poste.");
      return;
    }

    let targetUnitId = wUnitId;
    if (!targetUnitId && units.length > 0) {
      targetUnitId = units[0].id;
    } else if (!targetUnitId) {
      // If no unit exists, auto-create a default one to preserve database integrity
      const newUnitId = `ut_${Date.now()}`;
      const defaultUnit: WorkingUnit = {
        id: newUnitId,
        name: "UT par défaut - Poste",
        description: "Unité de travail créée automatiquement lors de l'attribution du poste.",
        totalCDI: wWomen + wMen,
        totalCDD: 0
      };
      setUnits(prev => [...prev, defaultUnit]);
      targetUnitId = newUnitId;
    }

    const totalCount = wWomen + wMen;

    const editedObject: Workstation = {
      id: editingW ? editingW.id : `w_${Date.now()}`,
      name: wName.trim(),
      unitId: targetUnitId,
      description: wDesc.trim(),
      employeeCount: totalCount,
      demographics: {
        women: wWomen,
        men: wMen,
        under18: wUnder18,
        disabled: wDisabled,
        nightWorker: wNightWorker
      }
    };

    if (editingW) {
      setWorkstations(prev => prev.map(item => item.id === editingW.id ? editedObject : item));
    } else {
      setWorkstations(prev => [...prev, editedObject]);
    }

    setShowForm(false);
  };

  const deleteWorkstation = (id: string) => {
    if (deleteWConfirmId === id) {
      setWorkstations(prev => prev.filter((w) => w.id !== id));
      setDeleteWConfirmId(null);
    } else {
      setDeleteWConfirmId(id);
      setTimeout(() => {
        setDeleteWConfirmId(prev => prev === id ? null : prev);
      }, 3000);
    }
  };

  // AI Extraction handler for a pasted Fiche de Poste
  const handleAnalyzeJobDescription = async () => {
    if (!jobDescriptionText.trim()) {
      setAiError("Veuillez coller ou écrire un texte de fiche de poste pour lancer l'analyse.");
      return;
    }

    setIsAnalyzing(true);
    setAiError("");
    setAiSuccessMessage("");

    try {
      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: jobDescriptionText.trim(), 
          type: "workstations" 
        })
      });

      if (!response.ok) {
        throw new Error("Erreur de communication avec le serveur d'analyse.");
      }

      const rawJson = await response.json();
      const extractedJobs = rawJson.data !== undefined ? rawJson.data : rawJson;

      if (!Array.isArray(extractedJobs) || extractedJobs.length === 0) {
        throw new Error("L'intelligence artificielle n'a trouvé aucun poste valide dans ce texte.");
      }

      const firstExtracted = extractedJobs[0];

      // Auto-assign or auto-create the parsed unit
      let finalUnitId = "";
      const unitNameExtracted = firstExtracted.unitName || "Services Généraux";
      const existingUnit = units.find(u => u.name.toLowerCase().includes(unitNameExtracted.toLowerCase()));
      
      if (existingUnit) {
        finalUnitId = existingUnit.id;
      } else {
        // Auto-create a brand new unit
        const newUnitId = `ut_${Date.now()}`;
        const newUnit: WorkingUnit = {
          id: newUnitId,
          name: unitNameExtracted,
          description: `Créé automatiquement pour le poste ${firstExtracted.name}`,
          totalCDI: firstExtracted.employeeCount || 1,
          totalCDD: 0
        };
        setUnits(prev => [...prev, newUnit]);
        finalUnitId = newUnitId;
      }

      // Prepopulate form states with extracted parameters to allow user confirmation
      setWName(firstExtracted.name || "Nouveau Poste");
      setWUnitId(finalUnitId);
      setWDesc(firstExtracted.description || "");
      
      const demo = firstExtracted.demographics || {};
      setWWomen(demo.women || 0);
      setWMen(demo.men || 0);
      setWUnder18(demo.under18 || 0);
      setWDisabled(demo.disabled || 0);
      setWNightWorker(demo.nightWorker || 0);

      setAiSuccessMessage(`Analyse Gemini complétée avec succès ! Le poste "${firstExtracted.name}" a été extrait. Veuillez vérifier les détails ci-après puis cliquez sur Valider.`);
      setJobDescriptionText(""); // Clearing input text
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Impossible d'extraire les informations du poste.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4" id="workstations-tab-container">
      {/* 1. HEADER SECTION */}
      <div className="bg-white rounded-lg shadow-xs border border-slate-200 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
            Fiches de Poste de Travail
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1.5 flex items-center gap-2 leading-tight">
            <Users className="w-4 h-4 text-indigo-600" />
            Gestion des Fiches et Descriptifs de Poste
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cet onglet est alimenté exclusivement lorsque vous fournissez ou importez une **Fiche de Poste** spécifique. Les effectifs déclarés ici guideront le suivi de médecine du travail.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleOpenNewW}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
            id="btn-add-w-standalone"
          >
            <Plus className="w-3.5 h-3.5" /> Créer manuellement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. ANALYSER UNE FICHE DE POSTE */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 lg:col-span-1 h-fit space-y-4">
          <span className="text-xs font-bold text-indigo-900 block border-b border-indigo-50 pb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            Alimenter via une Fiche de Poste (Gemini API)
          </span>

          <p className="text-xs text-slate-500 leading-relaxed">
            Fournissez le descriptif de poste ci-dessous (Missions, effectifs, conditions physiques). L'intelligence artificielle extraira automatiquement toutes les informations structurées.
          </p>

          <textarea
            value={jobDescriptionText}
            onChange={(e) => setJobDescriptionText(e.target.value)}
            disabled={isAnalyzing}
            placeholder="Collez ou écrivez ici la fiche de poste... (Ex: Technicien de soudure de nuit, missions de pointage MAG, équipe de 4 hommes...)"
            rows={6}
            className="w-full text-xs border border-slate-200 rounded-md p-2.5 bg-slate-50/50 focus:outline-indigo-500 bg-white"
          />

          {aiError && (
            <div className="p-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded">
              {aiError}
            </div>
          )}

          {aiSuccessMessage && (
            <div className="p-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded">
              {aiSuccessMessage}
            </div>
          )}

          <button
            onClick={handleAnalyzeJobDescription}
            disabled={isAnalyzing || !jobDescriptionText.trim()}
            className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-90 rounded-md transition-all shadow-xs disabled:opacity-40"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse Gemini en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Analyser la Fiche
              </>
            )}
          </button>
        </div>

        {/* 3. POSTES DE TRAVAIL ENREGISTRÉS */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 lg:col-span-2 space-y-4">
          <span className="text-xs font-bold text-slate-800 block border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-teal-600" />
            Postes de Travail Déclarés ({workstations.length})
          </span>

          {workstations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <FileText className="w-10 h-10 text-slate-250 mx-auto" />
              <p className="text-xs font-medium">Aucun poste de travail n'a encore été importé ou déclaré.</p>
              <p className="text-[10px] text-slate-350 max-w-sm mx-auto">
                Utilisez l'analyseur intelligent ci-contre ou le bouton de création manuelle pour démarrer. Les postes créés apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {workstations.map((w) => {
                const matchingUnit = units.find((u) => u.id === w.unitId);

                return (
                  <div
                    key={w.id}
                    className="border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 hover:bg-indigo-50/5 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">{w.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono tracking-close block mt-0.5">
                            Rattaché : {matchingUnit ? matchingUnit.name : "Sans Unité de Travail"}
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => openEditW(w)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {deleteWConfirmId === w.id ? (
                            <button
                              onClick={() => deleteWorkstation(w.id)}
                              className="px-1.5 py-0.5 text-[9px] font-bold text-white bg-red-650 bg-red-600 hover:bg-red-750 rounded transition-all animate-pulse"
                            >
                              Confirmer
                            </button>
                          ) : (
                            <button
                              onClick={() => deleteWorkstation(w.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 italic">{w.description}</p>

                      <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-100/60 mt-1">
                        <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                          Salariés: {w.employeeCount} ({w.demographics.women} F / {w.demographics.men} H)
                        </span>
                        {w.demographics.nightWorker > 0 && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 font-bold border border-amber-100 px-1.5 py-0.5 rounded">
                            Travail Nuit: {w.demographics.nightWorker}
                          </span>
                        )}
                        {w.demographics.under18 > 0 && (
                          <span className="text-[9px] bg-rose-50 text-rose-700 font-bold border border-rose-100 px-1.5 py-0.5 rounded">
                            Minors: {w.demographics.under18}
                          </span>
                        )}
                        {w.demographics.disabled > 0 && (
                          <span className="text-[9px] bg-teal-50 text-teal-700 font-bold border border-teal-100 px-1.5 py-0.5 rounded">
                            RQTH: {w.demographics.disabled}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FORM MODAL (ADD / EDIT POSITION) */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-slate-800 mb-4 flex justify-between items-center">
              <span>{editingW ? "Modifier le Poste de Travail" : "Créer un Poste de Travail"}</span>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </h3>

            <form onSubmit={handleAddOrEditWorkstation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Intitulé du poste *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Opérateur Cabine de Vernis"
                    value={wName}
                    onChange={(e) => setWName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Unité de Travail associée (DUER) *</label>
                  <select
                    value={wUnitId}
                    onChange={(e) => setWUnitId(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                  >
                    <option value="">Sélectionner une UT...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description / Activités particulières</label>
                <textarea
                  placeholder="Descriptif rapide des missions..."
                  value={wDesc}
                  rows={2}
                  onChange={(e) => setWDesc(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-3.5 border border-slate-100">
                <span className="text-xs font-bold text-indigo-900 block border-b border-indigo-100 pb-1.5">
                  Profils démographiques (Impact direct HAS / INRS)
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nombre d'hommes (H)</label>
                    <input
                      type="number"
                      min={0}
                      value={wMen}
                      onChange={(e) => setWMen(parseInt(e.target.value) || 0)}
                      className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nombre de femmes (F)</label>
                    <input
                      type="number"
                      min={0}
                      value={wWomen}
                      onChange={(e) => setWWomen(parseInt(e.target.value) || 0)}
                      className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Travail de nuit</label>
                    <input
                      type="number"
                      min={0}
                      value={wNightWorker}
                      onChange={(e) => setWNightWorker(parseInt(e.target.value) || 0)}
                      className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Moins de 18 ans</label>
                    <input
                      type="number"
                      min={0}
                      value={wUnder18}
                      onChange={(e) => setWUnder18(parseInt(e.target.value) || 0)}
                      className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Handicap (RQTH)</label>
                    <input
                      type="number"
                      min={0}
                      value={wDisabled}
                      onChange={(e) => setWDisabled(parseInt(e.target.value) || 0)}
                      className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-550 hover:bg-slate-100 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
