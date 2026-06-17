/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { WorkingUnit, SafetyChemicalSheet, Workstation } from "../types";
import { FlaskConical, Plus, Trash2, Edit2, AlertTriangle, CheckSquare, Check, Sparkles } from "lucide-react";

interface FDSManagerProps {
  fdsSheets: SafetyChemicalSheet[];
  setFdsSheets: React.Dispatch<React.SetStateAction<SafetyChemicalSheet[]>>;
  workstations: Workstation[];
  units: WorkingUnit[];
}

const CLP_DIAG_PICTOGRAMS = [
  { id: "corrosive", label: "Corrosif (GHS05)" },
  { id: "cmr", label: "Danger Santé / CMR (GHS08)" },
  { id: "toxic", label: "Toxique (GHS06)" },
  { id: "flammable", label: "Inflammable (GHS02)" },
  { id: "harmful", label: "Nocif / Irritant (GHS07)" }
];

export default function FDSManager({ fdsSheets, setFdsSheets, workstations, units }: FDSManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingSheet, setEditingSheet] = useState<SafetyChemicalSheet | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [packaging, setPackaging] = useState("");
  const [hasFds, setHasFds] = useState(true);
  const [casNumberInput, setCasNumberInput] = useState("");
  const [hazardPhraseInput, setHazardPhraseInput] = useState("");
  const [selectedPics, setSelectedPics] = useState<string[]>([]);
  const [exposedPostes, setExposedPostes] = useState<string[]>([]);
  const [exposedUnits, setExposedUnits] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      alert("Veuillez saisir le nom du produit.");
      return;
    }

    // Process comma separated lists safely
    const casNumbers = casNumberInput
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const hazardPhrases = hazardPhraseInput
      .split(",")
      .map((h) => h.trim().toUpperCase())
      .filter((h) => h.length > 0);

    const editedObject: SafetyChemicalSheet = {
      id: editingSheet ? editingSheet.id : `fds_${Date.now()}`,
      productName,
      manufacturer,
      packaging,
      hasFds,
      casNumbers,
      hazardPhrases,
      pictograms: selectedPics,
      exposedWorkstationIds: exposedPostes,
      exposedUnitIds: exposedUnits,
    };

    if (editingSheet) {
      setFdsSheets(fdsSheets.map((sh) => (sh.id === editingSheet.id ? editedObject : sh)));
    } else {
      setFdsSheets([...fdsSheets, editedObject]);
    }

    closeModal();
  };

  const handleEdit = (sh: SafetyChemicalSheet) => {
    setEditingSheet(sh);
    setProductName(sh.productName);
    setManufacturer(sh.manufacturer);
    setPackaging(sh.packaging);
    setHasFds(sh.hasFds);
    setCasNumberInput(sh.casNumbers.join(", "));
    setHazardPhraseInput(sh.hazardPhrases.join(", "));
    setSelectedPics(sh.pictograms);
    setExposedPostes(sh.exposedWorkstationIds);
    setExposedUnits(sh.exposedUnitIds || []);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      setFdsSheets(fdsSheets.filter((sh) => sh.id !== id));
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => {
        setDeleteConfirmId((prev) => (prev === id ? null : prev));
      }, 3000);
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingSheet(null);
    setProductName("");
    setManufacturer("");
    setPackaging("");
    setHasFds(true);
    setCasNumberInput("");
    setHazardPhraseInput("");
    setSelectedPics([]);
    setExposedPostes([]);
    setExposedUnits([]);
  };

  const togglePicSelection = (id: string) => {
    if (selectedPics.includes(id)) {
      setSelectedPics(selectedPics.filter((p) => p !== id));
    } else {
      setSelectedPics([...selectedPics, id]);
    }
  };

  const togglePosteInclusion = (id: string) => {
    if (exposedPostes.includes(id)) {
      setExposedPostes(exposedPostes.filter((p) => p !== id));
    } else {
      setExposedPostes([...exposedPostes, id]);
    }
  };

  const toggleUnitInclusion = (id: string) => {
    if (exposedUnits.includes(id)) {
      setExposedUnits(exposedUnits.filter((u) => u !== id));
    } else {
      setExposedUnits([...exposedUnits, id]);
    }
  };
  return (
    <div className="space-y-4" id="fds-module-container">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-lg shadow-xs border border-slate-200 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
        <div>
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
            Fiches de Données de Sécurité (FDS)
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1.5 flex items-center gap-2 leading-tight">
            <FlaskConical className="w-4 h-4 text-blue-600 animate-pulse" />
            Inventaire des Agents Chimiques Dangereux (ACD)
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Saisissez les fiches toxicologiques pour identifier la présence de risques CMR complexes (Cancérogènes, Mutagènes, Reprotoxiques). Le logiciel calculera les implications légales sur le suivi médical.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSheet(null);
            setProductName("");
            setManufacturer("");
            setPackaging("");
            setHasFds(true);
            setCasNumberInput("");
            setHazardPhraseInput("");
            setSelectedPics([]);
            setExposedPostes([]);
            setShowForm(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition shadow-xs w-full md:w-auto justify-center shrink-0"
          id="btn-add-fds"
        >
          <Plus className="w-3.5 h-3.5" /> Référencer un Produit (FDS)
        </button>
      </div>

      {/* INVENTORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fdsSheets.length === 0 ? (
          <div className="bg-white col-span-2 rounded-lg border border-dashed border-slate-310 py-10 text-center">
            <AlertTriangle className="w-6 h-6 text-slate-305 mx-auto mb-1.5" />
            <p className="text-slate-400 text-xs font-medium">Aucun agent chimique référencé.</p>
          </div>
        ) : (
          fdsSheets.map((sh) => {
            const hasCmr = sh.hazardPhrases.some(
              (p) => p.startsWith("H350") || p.startsWith("H340") || p.startsWith("H360")
            );

            return (
              <div
                key={sh.id}
                className={`bg-white border rounded-lg p-3.5 hover:shadow-xs transition-all flex flex-col justify-between ${
                  hasCmr ? "border-rose-400 bg-rose-50/5" : "border-slate-200"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      {hasCmr && (
                        <span className="text-[9px] font-bold bg-rose-600 text-white uppercase px-1.5 py-0.5 rounded inline-block mb-1">
                          Agent CMR Avéré/Suspecté
                        </span>
                      )}
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{sh.productName}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {sh.manufacturer || "Fabricant inconnu"} {sh.packaging ? `• Pack: ${sh.packaging}` : ""}
                      </p>
                    </div>

                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        sh.hasFds ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {sh.hasFds ? "FDS OK" : "FDS Absente"}
                    </span>
                  </div>

                  {/* Chemical compounds & H phrases */}
                  <div className="space-y-1 pt-0.5">
                    {sh.casNumbers.length > 0 && (
                      <div className="text-[11px] space-y-1">
                        <div>
                          <strong className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Composants & CAS :</strong>
                        </div>
                        <div className="flex flex-col gap-1.5 pl-1.5 pb-1">
                          {sh.casNumbers.map((casStr, idx) => {
                            const casMatch = casStr.match(/\d+-\d+-\d+/);
                            const casClean = casMatch ? casMatch[0] : casStr.trim();
                            
                            return (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-50 p-1.5 rounded border border-slate-100/60">
                                <span className="text-[10px] font-mono font-semibold text-slate-700 break-all">{casStr}</span>
                                <div className="flex gap-1.5 shrink-0 self-end sm:self-auto pb-0.5 sm:pb-0">
                                  <a
                                    href={`https://echa.europa.eu/fr/search-for-chemicals?_disssearchsubstance_WAR_disssearchportlet_query=${encodeURIComponent(casClean)}`}
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                    rel="noopener noreferrer"
                                    className="text-[9px] bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5 transition-colors"
                                    title="Consulter l'Enregistrement REACH sur ECHA"
                                  >
                                    ECHA ↗
                                  </a>
                                  <a
                                    href={`https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(casClean)}`}
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                    rel="noopener noreferrer"
                                    className="text-[9px] bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5 transition-colors"
                                    title="Consulter le Compound Summary sur PubChem"
                                  >
                                    PubChem ↗
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {sh.hazardPhrases.map((ph) => {
                        const isCmrP = ph.startsWith("H340") || ph.startsWith("H350") || ph.startsWith("H360");
                        const isRepro3 = ph.startsWith("H361");

                        return (
                          <span
                            key={ph}
                            className={`text-[9px] font-bold font-mono rounded px-1.5 py-0.5 ${
                              isCmrP
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : isRepro3
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200/50"
                            }`}
                          >
                            {ph}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pictograms list */}
                  {sh.pictograms.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {sh.pictograms.map((pic) => {
                        const matched = CLP_DIAG_PICTOGRAMS.find((p) => p.id === pic);
                        return (
                          <span
                            key={pic}
                            className="text-[9px] uppercase tracking-wide font-bold bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded"
                          >
                            {matched ? matched.label.split(" ")[0] : pic}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Exposed Workstations */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">
                      Postes exposés et manipulants:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {sh.exposedWorkstationIds.length === 0 ? (
                        <span className="text-[10px] text-slate-400 italic">Aucun poste attribué</span>
                      ) : (
                        workstations
                          .filter((w) => sh.exposedWorkstationIds.includes(w.id))
                          .map((w) => (
                            <span
                              key={w.id}
                              className="text-[9px] bg-slate-50 border border-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded"
                            >
                              {w.name}
                            </span>
                          ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 justify-end pt-2 mt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleEdit(sh)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
                  >
                    <Edit2 className="w-3 h-3" /> Corriger
                  </button>
                  {deleteConfirmId === sh.id ? (
                    <button
                      onClick={() => handleDelete(sh.id)}
                      className="p-1 px-2 text-[11px] font-extrabold text-white bg-red-650 bg-red-600 hover:bg-red-750 rounded transition flex items-center gap-1 shrink-0 animate-pulse"
                      title="Cliquez à nouveau pour confirmer la suppression"
                    >
                      <Trash2 className="w-3 h-3 text-white" /> Confirmer ?
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDelete(sh.id)}
                      className="p-1 px-2 text-xs font-bold text-slate-500 hover:text-rose-600 rounded hover:bg-slate-50 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" /> Supprimer
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DIALOG FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 border border-slate-100 max-h-[95vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              {editingSheet ? "Modifier la Fiche Produit Chimique" : "Référencer un Produit Chimique"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nom commercial du produit *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Diluant Solvant PU"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Fabricant / Fournisseur</label>
                  <input
                    type="text"
                    placeholder="Ex: Icro Coatings, Henkel..."
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Type de Conditionnement</label>
                  <input
                    type="text"
                    placeholder="Ex: Flacon 1L, Bidon 5L, Sachet..."
                    value={packaging}
                    onChange={(e) => setPackaging(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">FDS Disponible ?</label>
                  <select
                    value={hasFds ? "yes" : "no"}
                    onChange={(e) => setHasFds(e.target.value === "yes")}
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-rose-500"
                  >
                    <option value="yes">Oui, fiches complètes</option>
                    <option value="no">Non, absente ou incomplète</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Composants réglementaires d'intérêt / Numéros CAS (séparés par virgule)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 67-64-1 (Acétone), 1330-20-7 (Xylène)"
                  value={casNumberInput}
                  onChange={(e) => setCasNumberInput(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 font-mono bg-white focus:outline-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Phrases de danger / Informations H CLP (séparées par virgule)
                </label>
                <input
                  type="text"
                  placeholder="Ex: H225, H351, H361d, H336"
                  value={hazardPhraseInput}
                  onChange={(e) => setHazardPhraseInput(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 font-mono bg-white focus:outline-rose-500"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  💡 Rappel : Les codes commençant par <strong>H340, H350 ou H360</strong> déclenchent immédiatement un suivi médical renforcé (<strong>SIR</strong>) pour les postes associés.
                </span>
              </div>

              {/* CLP PICTOGRAMS SELECTOR */}
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-2">
                  Pictogrammes de danger applicables (Saisie FDS) :
                </span>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {CLP_DIAG_PICTOGRAMS.map((pic) => {
                    const isSelected = selectedPics.includes(pic.id);

                    return (
                      <button
                        key={pic.id}
                        type="button"
                        onClick={() => togglePicSelection(pic.id)}
                        className={`p-2 text-xs font-medium border rounded text-center transition-all ${
                          isSelected
                            ? "bg-rose-50 text-rose-800 border-rose-300 font-semibold"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {pic.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EXPOSED UNITS & WORKSTATIONS SELECTORS */}
              <div className="space-y-3">
                {/* 1. Unités de Travail exposition */}
                <div className="border border-teal-100 rounded-lg p-4 bg-teal-50/5">
                  <span className="block text-xs font-semibold text-teal-900 mb-2 uppercase">
                    Associer l'exposition aux Unités de Travail (logique DUER/Situation de travail) :
                  </span>

                  {units.length === 0 ? (
                    <p className="text-[11px] text-slate-400">Aucune unité de travail déclarée. Veuillez en configurer dans l'onglet Établissement.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {units.map((u) => {
                        const isIncluded = exposedUnits.includes(u.id);

                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleUnitInclusion(u.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-all border ${
                              isIncluded
                                ? "bg-teal-50 text-teal-800 border-teal-200 font-semibold"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <CheckSquare className={`w-3.5 h-3.5 ${isIncluded ? "text-teal-600" : "text-slate-300"}`} />
                            {u.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Postes exposition (only if workstations exist) */}
                {workstations.length > 0 && (
                  <div className="border border-rose-100 rounded-lg p-4 bg-rose-50/5">
                    <span className="block text-xs font-semibold text-rose-900 mb-2 uppercase">
                      Associer également aux Postes de Travail spécifiques (si fiches fournies) :
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {workstations.map((w) => {
                        const isIncluded = exposedPostes.includes(w.id);

                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => togglePosteInclusion(w.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-all border ${
                              isIncluded
                                ? "bg-rose-50 text-rose-800 border-rose-200 font-semibold"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <CheckSquare className={`w-3.5 h-3.5 ${isIncluded ? "text-rose-600" : "text-slate-300"}`} />
                            {w.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
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
