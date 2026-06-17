/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { HazardEvaluation, WorkingUnit, Workstation } from "../types";
import { ShieldAlert, Plus, Trash2, Edit2, AlertCircle, Sparkles, Check, CheckSquare, Activity, FlaskConical, Printer } from "lucide-react";

const isRealIbe = (ibeText: string | undefined): boolean => {
  if (!ibeText) return false;
  const clean = ibeText.trim().toUpperCase();
  return (
    clean !== "" &&
    clean !== "N/A" &&
    clean !== "—" &&
    clean !== "AUCUN" &&
    !clean.startsWith("N/A") &&
    !clean.startsWith("AUCUN") &&
    !clean.startsWith("PAS D'EXPOSITION") &&
    !clean.startsWith("SANS OBJET") &&
    !clean.includes("AUCUN BIOMONITORING REQUIS") &&
    !clean.includes("SANS DONNÉES")
  );
};

const isRealMetrology = (metroText: string | undefined): boolean => {
  if (!metroText) return false;
  const clean = metroText.trim().toUpperCase();
  return (
    clean !== "" &&
    clean !== "N/A" &&
    clean !== "—" &&
    clean !== "AUCUNE" &&
    !clean.startsWith("N/A") &&
    !clean.startsWith("AUCUNE") &&
    !clean.includes("AUCUNE MESURE")
  );
};

interface DUERPManagerProps {
  evaluations: HazardEvaluation[];
  setEvaluations: React.Dispatch<React.SetStateAction<HazardEvaluation[]>>;
  units: WorkingUnit[];
  workstations: Workstation[];
}

const RISK_CATEGORIES = [
  "Equipements de travail",
  "Activités manuelles et ergonomie",
  "Bruit",
  "Risques chimiques",
  "Locaux de travail",
  "Travail sur écran",
  "Risques Routiers",
  "Chutes et Déplacements",
  "Rayonnements",
  "Vibrations mécaniques",
  "Infection Biologique",
  "Risque Psychosocial",
  "Risques d'incendies et d'explosions",
  "Autre"
];

// Mastery coefficient options
const MASTERY_COEFFS = [
  { value: 0.3, label: "Très efficaces (x0.3)" },
  { value: 0.4, label: "Efficaces (x0.4)" },
  { value: 0.6, label: "Moyennement efficaces (x0.6)" },
  { value: 0.8, label: "Insuffisantes (x0.8)" },
  { value: 1.0, label: "Inexistantes (x1.0)" },
];

export default function DUERPManager({
  evaluations,
  setEvaluations,
  units,
  workstations,
}: DUERPManagerProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingEval, setEditingEval] = useState<HazardEvaluation | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [unitId, setUnitId] = useState("");
  const [category, setCategory] = useState(RISK_CATEGORIES[0]);
  const [dangerSource, setDangerSource] = useState("");
  const [gravity, setGravity] = useState<number>(2);
  const [frequency, setFrequency] = useState<number>(2);
  const [masteryCoeff, setMasteryCoeff] = useState<number>(0.4);
  const [existingMeasureStr, setExistingMeasureStr] = useState("");
  const [recommendedMeasureStr, setRecommendedMeasureStr] = useState("");
  const [exposedPostes, setExposedPostes] = useState<string[]>([]);
  const [metrology, setMetrology] = useState("");
  const [ibe, setIbe] = useState("");

  // Helpers for styling risk
  const getRiskMetadata = (realRisk: number) => {
    if (realRisk <= 3.0) {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        pill: "bg-emerald-500 text-white",
        label: "Priorité 3 : Risque Faible",
      };
    } else if (realRisk <= 8.0) {
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        pill: "bg-amber-500 text-white",
        label: "Priorité 2 : Risque Important",
      };
    } else {
      return {
        bg: "bg-rose-50 text-rose-700 border-rose-200",
        pill: "bg-rose-500 text-white",
        label: "Priorité 1 : Risque Élevé (Prioritaire)",
      };
    }
  };

  const currentUnitW = workstations.filter((w) => w.unitId === unitId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dangerSource.trim() || !unitId) {
      alert("Veuillez sélectionner une Unité de Travail et décrire la source de danger.");
      return;
    }

    const pr = gravity * frequency;
    const countRealRisk = pr * masteryCoeff;

    // Parse list arrays
    const existing = existingMeasureStr
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const recommended = recommendedMeasureStr
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const editedObject: HazardEvaluation = {
      id: editingEval ? editingEval.id : `e_${Date.now()}`,
      unitId,
      category,
      dangerSource,
      gravity,
      frequency,
      potentialRisk: pr,
      masteryCoeff,
      realRisk: countRealRisk,
      existingMeasures: existing,
      recommendedMeasures: recommended,
      exposedWorkstationIds: exposedPostes,
      metrology: metrology.trim(),
      ibe: ibe.trim(),
    };

    if (editingEval) {
      setEvaluations(evaluations.map((ev) => (ev.id === editingEval.id ? editedObject : ev)));
    } else {
      setEvaluations([...evaluations, editedObject]);
    }

    closeModal();
  };

  const handleEdit = (ev: HazardEvaluation) => {
    setEditingEval(ev);
    setUnitId(ev.unitId);
    setCategory(ev.category);
    setDangerSource(ev.dangerSource);
    setGravity(ev.gravity);
    setFrequency(ev.frequency);
    setMasteryCoeff(ev.masteryCoeff);
    setExistingMeasureStr(ev.existingMeasures.join("\n"));
    setRecommendedMeasureStr(ev.recommendedMeasures.join("\n"));
    setExposedPostes(ev.exposedWorkstationIds);
    setMetrology(ev.metrology || "");
    setIbe(ev.ibe || "");
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      setEvaluations(evaluations.filter((ev) => ev.id !== id));
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
    setEditingEval(null);
    setDangerSource("");
    setGravity(2);
    setFrequency(2);
    setMasteryCoeff(0.4);
    setExistingMeasureStr("");
    setRecommendedMeasureStr("");
    setExposedPostes([]);
    setMetrology("");
    setIbe("");
  };

  const togglePosteInclusion = (id: string) => {
    if (exposedPostes.includes(id)) {
      setExposedPostes(exposedPostes.filter((p) => p !== id));
    } else {
      setExposedPostes([...exposedPostes, id]);
    }
  };

  const filteredEvals =
    selectedUnitId === "all" ? evaluations : evaluations.filter((ev) => ev.unitId === selectedUnitId);

  return (
    <div className="space-y-4" id="duerp-module-container">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-lg shadow-xs border border-slate-200 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
        <div>
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
            Document Unique (DUERP)
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1.5 flex items-center gap-2 leading-tight">
            <ShieldAlert className="w-4 h-4 text-blue-600 animate-pulse" />
            Évaluation Générale des Risques Professionnels
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Saisissez et étudiez les risques associés à chaque Unité de Travail. Les coefficients de maîtrise s'appliquent sur le Risque Potentiel (RP = G x F) pour donner la cotation finale (R).
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0 no-print">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 bg-white rounded text-xs font-bold shadow-xs transition cursor-pointer w-full md:w-auto"
            id="btn-print-duerp"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimer / PDF</span>
          </button>

          <button
            onClick={() => {
              if (units.length === 0) {
                alert("Veuillez d'abord déclarer une Unité de Travail (UT) dans la fiche d'entreprise");
                return;
              }
              setEditingEval(null);
              setUnitId(units[0].id);
              setCategory(RISK_CATEGORIES[0]);
              setDangerSource("");
              setGravity(2);
              setFrequency(2);
              setMasteryCoeff(0.4);
              setExistingMeasureStr("");
              setRecommendedMeasureStr("");
              setExposedPostes([]);
              setShowForm(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition shadow-xs w-full md:w-auto justify-center shrink-0 cursor-pointer"
            id="btn-add-risk-eval"
          >
            <Plus className="w-3.5 h-3.5" /> Évaluer un Risque (DU)
          </button>
        </div>
      </div>

      {/* FILTER BAR - High Density Tabs style */}
      <div className="flex bg-slate-900 rounded p-1 border border-slate-800 shadow-sm overflow-x-auto gap-0.5" id="duerp-unit-tabs">
        <button
          onClick={() => setSelectedUnitId("all")}
          className={`px-3 py-1.5 text-xs font-bold rounded transition-all whitespace-nowrap ${
            selectedUnitId === "all"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          Toutes les UT ({evaluations.length})
        </button>
        {units.map((unit) => {
          const evalCount = evaluations.filter((ev) => ev.unitId === unit.id).length;
          return (
            <button
              key={unit.id}
              onClick={() => setSelectedUnitId(unit.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded transition-all whitespace-nowrap ${
                selectedUnitId === unit.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              {unit.name.split(":")[0]} ({evalCount})
            </button>
          );
        })}
      </div>

      {/* GRIDS & RISK EVALUATIONS SUMMARY */}
      <div className="space-y-3">
        {filteredEvals.length === 0 ? (
          <div className="bg-white rounded-lg border border-dashed border-slate-310 py-10 text-center">
            <AlertCircle className="w-6 h-6 text-slate-305 mx-auto mb-1.5" />
            <p className="text-slate-400 text-xs font-medium">Aucun risque n'est encore évalué pour cette sélection.</p>
          </div>
        ) : (
          filteredEvals.map((ev) => {
            const unitObj = units.find((u) => u.id === ev.unitId);
            const riskMeta = getRiskMetadata(ev.realRisk);
            const matchedExposedPostes = workstations.filter((w) => ev.exposedWorkstationIds.includes(w.id));

            return (
              <div
                key={ev.id}
                className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col md:flex-row gap-4 items-start justify-between"
              >
                {/* Risk Content */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] uppercase font-bold font-mono tracking-wider bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {ev.category}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold font-mono">
                      | {unitObj ? unitObj.name : "Sans Unité"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 flex items-start gap-1.5">
                      <span className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0 animate-ping"></span>
                      {ev.dangerSource}
                    </h4>
                  </div>

                  {/* Calculations Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 p-2 rounded border border-slate-200/60">
                    <div className="text-[10px] font-mono text-slate-500">
                      Gravité: <span className="font-bold text-slate-700">{ev.gravity}/4</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Fréquence: <span className="font-bold text-slate-700">{ev.frequency}/4</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      RP brute: <span className="font-bold text-slate-700">{ev.potentialRisk}/16</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Maîtrise: <span className="font-bold text-slate-700">x{ev.masteryCoeff}</span>
                    </div>
                  </div>

                  {/* Exisiting Measures vs Recommended */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
                    {ev.existingMeasures.length > 0 && (
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wide">Prévention Existante</span>
                        <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside font-medium">
                          {ev.existingMeasures.map((measure, idx) => (
                            <li key={idx} className="line-clamp-2">{measure}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {ev.recommendedMeasures.length > 0 && (
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-blue-500 block font-bold uppercase tracking-wide">Mesures Préconisées prioritaires</span>
                        <ul className="text-[11px] text-slate-700 space-y-0.5 list-disc list-inside font-semibold">
                          {ev.recommendedMeasures.map((measure, idx) => (
                            <li key={idx} className="line-clamp-2 text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{measure}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Exposed Positions */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wide">Postes exposés :</span>
                    {matchedExposedPostes.length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic">Tout poste lié à l'UT</span>
                    ) : (
                      matchedExposedPostes.map((p) => (
                        <span key={p.id} className="text-[9px] bg-slate-150 text-slate-750 font-bold px-1.5 py-0.5 border border-slate-205 rounded">
                          {p.name}
                        </span>
                      ))
                    )}
                  </div>

                  {/* METROLOGIE & IBE DETAILS IN CARD */}
                  {(isRealMetrology(ev.metrology) || isRealIbe(ev.ibe)) && (
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {isRealMetrology(ev.metrology) && (
                        <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2 flex items-start gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                          <div className="text-[10px]">
                            <span className="font-extrabold text-blue-900 block uppercase tracking-wider text-[8px] mb-0.5">Données Métrologie</span>
                            <span className="font-mono text-blue-800 leading-normal">{ev.metrology}</span>
                          </div>
                        </div>
                      )}
                      {isRealIbe(ev.ibe) && (
                        <div className="bg-rose-50/70 border border-rose-100 rounded-lg p-2 flex items-start gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-rose-650 mt-0.5 shrink-0" />
                          <div className="text-[10px]">
                            <span className="font-extrabold text-rose-900 block uppercase tracking-wider text-[8px] mb-0.5">Suivi Biologique (IBE)</span>
                            <span className="font-mono text-rose-800 leading-normal">{ev.ibe}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Score Pill / Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className={`border rounded p-2 text-center shrink-0 w-28 ${riskMeta.bg}`}>
                    <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Score de Risque R</span>
                    <span className="block text-xl font-extrabold font-mono my-0.5">{ev.realRisk.toFixed(1)}</span>
                    <span className="block text-[8px] font-semibold leading-none">{riskMeta.label.split(":")[1] || riskMeta.label}</span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEdit(ev)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Corriger
                    </button>
                    {deleteConfirmId === ev.id ? (
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-extrabold text-white bg-red-650 bg-red-600 hover:bg-red-750 rounded transition animate-pulse shrink-0"
                        title="Cliquez à nouveau pour confirmer"
                      >
                        <Trash2 className="w-3 h-3 text-white" /> Confirmer ?
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAILED FORM DIALOG (MODAL) */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 border border-slate-100 max-h-[95vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              {editingEval ? "Modifier l'évaluation du Risque" : "Ajouter un Risque au Document Unique"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Unité de Travail concernée *</label>
                  <select
                    required
                    value={unitId}
                    onChange={(e) => {
                      setUnitId(e.target.value);
                      setExposedPostes([]); // reset exposures
                    }}
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Famille réglementaire de risque *</label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                  >
                    {RISK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Source de danger / Description spécifique *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Utilisation de la scie à ruban TUBE (bruit, risque de coupure)"
                  value={dangerSource}
                  onChange={(e) => setDangerSource(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                />
              </div>

              {/* RATING SECTION */}
              <div className="bg-slate-100/50 p-4 rounded-lg space-y-4 border border-slate-200/50">
                <span className="text-xs font-semibold text-slate-700 block">Cotation Méthode Professionnelle (INRS)</span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Gravité brute (G) [1 à 4]</label>
                    <select
                      value={gravity}
                      onChange={(e) => setGravity(parseInt(e.target.value))}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-md p-2 bg-white"
                    >
                      <option value={1}>1 - Faible (Incidents mineurs)</option>
                      <option value={2}>2 - Moyenne (Accident avec arrêt &lt; 7 jours)</option>
                      <option value={3}>3 - Grave (Maladie Pro, arrêt &gt; 7 jours)</option>
                      <option value={4}>4 - Très Grave (Décès/Incapacité permanente)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fréquence expo (F) [1 à 4]</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(parseInt(e.target.value))}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-md p-2 bg-white"
                    >
                      <option value={1}>1 - Faible (Expo rare, &lt; 1 fois / mois)</option>
                      <option value={2}>2 - Moyenne (Expo &gt; 1 fois / semaine)</option>
                      <option value={3}>3 - Fréquente (Expo quotidienne)</option>
                      <option value={4}>4 - Très fréquente (Plusieurs fois par jour)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Maîtrise de prévention actuelle</label>
                    <select
                      value={masteryCoeff}
                      onChange={(e) => setMasteryCoeff(parseFloat(e.target.value))}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-md p-2 bg-white"
                    >
                      {MASTERY_COEFFS.map((el) => (
                        <option key={el.value} value={el.value}>
                          {el.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-xs text-slate-500">Calcul en temps réel :</span>
                  <div className="flex gap-4">
                    <span className="text-xs text-slate-700">
                      RP brute: <strong className="font-mono">{gravity * frequency}</strong>
                    </span>
                    <span className="text-xs text-slate-700">
                      Score Réel R: <strong className="font-mono text-indigo-600">{(gravity * frequency * masteryCoeff).toFixed(1)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* POSTES DISPOSITIF SELECTOR */}
              <div className="border border-slate-100 rounded-lg p-3">
                <span className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">
                  Quels poste(s) sont directement exposés à ce danger dans cette UT ?
                </span>

                {currentUnitW.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-1">Veuillez d'abord attribuer des postes à cette Unité de Travail.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentUnitW.map((w) => {
                      const isIncluded = exposedPostes.includes(w.id);

                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => togglePosteInclusion(w.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all border ${
                            isIncluded
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-medium"
                              : "bg-white text-slate-500 border-slate-250 hover:bg-slate-50"
                          }`}
                        >
                          <CheckSquare className={`w-3.5 h-3.5 ${isIncluded ? "text-indigo-600" : "text-slate-300"}`} />
                          {w.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ACTION TEXTAREAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Mesures de prévention existantes (une par ligne)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Aspiration localisée installée&#10;Protecteurs de lames présents&#10;Consignes d'utilisation à proximité"
                    value={existingMeasureStr}
                    onChange={(e) => setExistingMeasureStr(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500 font-sans leading-normal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Actions complémentaires préconisées (une par ligne)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Former systématiquement à la PRAP&#10;Afficher un panneau de port de casque antibruit"
                    value={recommendedMeasureStr}
                    onChange={(e) => setRecommendedMeasureStr(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500 font-sans leading-normal"
                  />
                </div>
              </div>

              {/* METROLOGIE ET IBE FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    📊 Données de métrologie / mesurages d'exposition (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Dose sonore Lex,8h : 86 dB(A) ou Concentration VLEP : 4.5 ppm"
                    value={metrology || ""}
                    onChange={(e) => setMetrology(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2.5 bg-white focus:outline-indigo-500 font-sans leading-normal border-slate-200"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block leading-normal">
                    Niveaux d'exposition physique ou chimiques mesurés sur le terrain.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    🧪 Indicateurs Biologiques d'Exposition (IBE / Biomonitoring) (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Acide méthylhippurique urinaire fin de poste (Biotox INRS)"
                    value={ibe || ""}
                    onChange={(e) => setIbe(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md p-2.5 bg-white focus:outline-indigo-500 font-sans leading-normal border-slate-200"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block leading-normal">
                    Dosages biologiques prescrits pour le suivi d'exposition des produits chimiques.
                  </span>
                </div>
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
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
