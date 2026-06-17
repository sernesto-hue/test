/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CompanyDatasheet, WorkingUnit, Workstation } from "../types";
import { Briefcase, Building2, UserCircle, Plus, Trash2, Edit2, Check } from "lucide-react";

interface CompanyFormProps {
  company: CompanyDatasheet;
  setCompany: React.Dispatch<React.SetStateAction<CompanyDatasheet>>;
  units: WorkingUnit[];
  setUnits: React.Dispatch<React.SetStateAction<WorkingUnit[]>>;
  workstations: Workstation[];
}

export default function CompanyForm({
  company,
  setCompany,
  units,
  setUnits,
  workstations,
}: CompanyFormProps) {
  const [editingCompany, setEditingCompany] = useState(false);
  const [localCompany, setLocalCompany] = useState<CompanyDatasheet>({ ...company });

  // Modals / forms state for Unités de Travail (UT)
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<WorkingUnit | null>(null);
  const [unitName, setUnitName] = useState("");
  const [unitDesc, setUnitNameDesc] = useState("");
  const [unitCDI, setUnitCDI] = useState(0);
  const [unitCDD, setUnitCDD] = useState(0);

  // Separate states for inline micro-interactions to bypass native confirm alerts
  const [deleteUnitConfirmId, setDeleteUnitConfirmId] = useState<string | null>(null);

  const saveCompany = () => {
    setCompany(localCompany);
    setEditingCompany(false);
  };

  const handleAddOrEditUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim()) return;

    if (selectedUnit) {
      // Edit
      setUnits(
        units.map((u) =>
          u.id === selectedUnit.id
            ? { ...u, name: unitName, description: unitDesc, totalCDI: unitCDI, totalCDD: unitCDD }
            : u
        )
      );
    } else {
      // Add
      const newUnit: WorkingUnit = {
        id: `u_${Date.now()}`,
        name: unitName,
        description: unitDesc,
        totalCDI: unitCDI,
        totalCDD: unitCDD,
      };
      setUnits([...units, newUnit]);
    }

    closeUnitForm();
  };

  const deleteUnit = (id: string) => {
    if (deleteUnitConfirmId === id) {
      setUnits(units.filter((u) => u.id !== id));
      setDeleteUnitConfirmId(null);
    } else {
      setDeleteUnitConfirmId(id);
      setTimeout(() => {
        setDeleteUnitConfirmId((prev) => (prev === id ? null : prev));
      }, 3000);
    }
  };

  const openEditUnit = (unit: WorkingUnit) => {
    setSelectedUnit(unit);
    setUnitName(unit.name);
    setUnitNameDesc(unit.description);
    setUnitCDI(unit.totalCDI);
    setUnitCDD(unit.totalCDD);
    setShowUnitForm(true);
  };

  const closeUnitForm = () => {
    setShowUnitForm(false);
    setSelectedUnit(null);
    setUnitName("");
    setUnitNameDesc("");
    setUnitCDI(0);
    setUnitCDD(0);
  };

  return (
    <div className="space-y-4 text-slate-800" id="enterprise-form-container">
      {/* 1. FICHE D'ENTREPRISE INFO */}
      <div className="bg-white rounded-lg shadow-xs border border-slate-200 p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
              Fiche d'entreprise
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1.5 flex items-center gap-2 leading-tight">
              <Building2 className="w-4 h-4 text-blue-600" />
              Informations Générales de l'Établissement
            </h2>
          </div>
          {!editingCompany ? (
            <button
              onClick={() => {
                setLocalCompany({ ...company });
                setEditingCompany(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
              id="btn-edit-company"
            >
              <Edit2 className="w-3.5 h-3.5" /> Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditingCompany(false)}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                id="btn-cancel-company"
              >
                Annuler
              </button>
              <button
                onClick={saveCompany}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                id="btn-save-company"
              >
                <Check className="w-3.5 h-3.5" /> Enregistrer
              </button>
            </div>
          )}
        </div>

        {!editingCompany ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Nom de l'entreprise</span>
              <span className="text-slate-900 font-bold text-sm">{company.name}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Numéro SIRET</span>
              <span className="text-slate-900 font-mono text-xs font-semibold">{company.siret || "N/A"}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Secteur d'activité</span>
              <span className="text-slate-800 text-xs font-semibold">{company.activitySector}</span>
            </div>
            <div className="space-y-0.5 md:col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Adresse postale</span>
              <span className="text-slate-800 text-xs font-semibold">{company.address}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Année de référence</span>
              <span className="text-slate-800 text-xs font-bold">{company.year}</span>
            </div>
            <div className="space-y-0.5 md:col-span-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Interlocuteur de prévention</span>
              <span className="text-slate-700 text-xs flex items-center gap-1.5 mt-1 bg-slate-50 p-1.5 rounded border border-slate-100 font-medium">
                <UserCircle className="w-3.5 h-3.5 text-slate-400" />
                {company.contactName} {company.contactEmail ? `(${company.contactEmail})` : ""}
              </span>
            </div>
            <div className="space-y-1 md:col-span-3">
              <span className="text-xs text-slate-400 block font-medium">Présentation de l'activité</span>
              <p className="text-slate-600 text-sm leading-relaxed mt-1">{company.description}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nom de l'entreprise *</label>
                <input
                  type="text"
                  value={localCompany.name}
                  onChange={(e) => setLocalCompany({ ...localCompany, name: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">SIRET *</label>
                <input
                  type="text"
                  value={localCompany.siret}
                  onChange={(e) => setLocalCompany({ ...localCompany, siret: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 font-mono bg-white focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Secteur d'activité *</label>
                <input
                  type="text"
                  value={localCompany.activitySector}
                  onChange={(e) => setLocalCompany({ ...localCompany, activitySector: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Adresse complète *</label>
                <input
                  type="text"
                  value={localCompany.address}
                  onChange={(e) => setLocalCompany({ ...localCompany, address: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Année d'étude *</label>
                <input
                  type="number"
                  value={localCompany.year}
                  onChange={(e) => setLocalCompany({ ...localCompany, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Interlocuteur principal *</label>
                <input
                  type="text"
                  value={localCompany.contactName}
                  onChange={(e) => setLocalCompany({ ...localCompany, contactName: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Email de l'interlocuteur</label>
                <input
                  type="email"
                  value={localCompany.contactEmail}
                  onChange={(e) => setLocalCompany({ ...localCompany, contactEmail: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Description / Activité principale</label>
              <textarea
                value={localCompany.description}
                rows={3}
                onChange={(e) => setLocalCompany({ ...localCompany, description: e.target.value })}
                className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. UNITÉS DE TRAVAIL */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-800 text-lg">Unités de Travail (UT / Situations collectives)</h3>
          </div>
          <button
            onClick={() => {
              setSelectedUnit(null);
              setUnitName("");
              setUnitNameDesc("");
              setUnitCDI(0);
              setUnitCDD(0);
              setShowUnitForm(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors"
            id="btn-add-unit"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter une UT
          </button>
        </div>

        {/* Unit Listing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8 col-span-full">Aucune unité de travail déclarée.</p>
          ) : (
            units.map((unit) => {
              const associatedW = workstations.filter((w) => w.unitId === unit.id);
              const totalEmp = associatedW.reduce((sum, w) => sum + w.employeeCount, 0);

              return (
                <div
                  key={unit.id}
                  className="border border-slate-200 bg-slate-50/10 rounded-lg p-4 hover:border-slate-300 hover:bg-slate-50/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-slate-800 text-sm">{unit.name}</h4>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => openEditUnit(unit)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {deleteUnitConfirmId === unit.id ? (
                          <button
                            onClick={() => deleteUnit(unit.id)}
                            className="px-2 py-1 text-[9px] font-bold text-white bg-red-600 rounded shrink-0 animate-pulse"
                          >
                            Confirmer
                          </button>
                        ) : (
                          <button
                            onClick={() => deleteUnit(unit.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-3">{unit.description}</p>
                  </div>

                  <div className="border-t border-slate-100/80 pt-3 mt-3 flex flex-wrap gap-2">
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded-sm">
                      {unit.totalCDI} CDI • {unit.totalCDD} CDD
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-sm">
                      {associatedW.length} postes ({totalEmp} d'effectif)
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* UNIT FORM DIALOG (MODAL) */}
      {showUnitForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-100">
            <h3 className="text-base font-semibold text-slate-800 mb-4">
              {selectedUnit ? "Modifier l'Unité de Travail" : "Ajouter une Unité de Travail"}
            </h3>
            <form onSubmit={handleAddOrEditUnit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nom / Libellé de l'UT *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: UT 3 : Finition acoustique"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description / Activités associées</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Zone de syntonisation, tests de fréquences, fignolages..."
                  value={unitDesc}
                  onChange={(e) => setUnitNameDesc(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Total Salariés CDI</label>
                  <input
                    type="number"
                    min={0}
                    value={unitCDI}
                    onChange={(e) => setUnitCDI(parseInt(e.target.value) || 0)}
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Total Salariés CDD / Saisonnier</label>
                  <input
                    type="number"
                    min={0}
                    value={unitCDD}
                    onChange={(e) => setUnitCDD(parseInt(e.target.value) || 0)}
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeUnitForm}
                  className="px-4 py-2 text-xs font-semibold text-slate-550 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors"
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
