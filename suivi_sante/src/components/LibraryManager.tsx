/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ACGIHChemicalRef, ACGIH_2025_DATABASE } from "../data/acgih_reference";
import { BookOpen, Search, HelpCircle, Activity, Info, Beaker, FileText, CheckCircle, ShieldAlert, Award } from "lucide-react";

export default function LibraryManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubstance, setSelectedSubstance] = useState<ACGIHChemicalRef | null>(ACGIH_2025_DATABASE[2]); // Default to n-Hexane

  // Filter based on query
  const filteredSubstances = ACGIH_2025_DATABASE.filter(sub => {
    const q = searchQuery.toLowerCase();
    return (
      sub.name.toLowerCase().includes(q) ||
      sub.frenchName.toLowerCase().includes(q) ||
      sub.cas.includes(q) ||
      sub.basis.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6" id="library-workspace">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white" id="library-icon-container">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight" id="library-title">
              Espace Bibliothèque &amp; Bases Scientifiques
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Consultation des valeurs de seuils atmosphériques (TLV) et biologiques (BEI) recommandées par l'ACGIH 2025
            </p>
          </div>
        </div>
        <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-1.5 text-xs text-indigo-800 font-bold self-start md:self-auto font-mono">
          <Award className="w-3.5 h-3.5 text-indigo-600" /> Référentiel ACGIH 2025
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: LIST AND SEARCH (5 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-indigo-500 shadow-xs"
              placeholder="Rechercher par nom, CAS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden max-h-[500px] overflow-y-auto">
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Composés ({filteredSubstances.length})</span>
            </div>
            {filteredSubstances.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">Aucun composé trouvé</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredSubstances.map((sub, idx) => {
                  const isSelected = selectedSubstance?.cas === sub.cas;
                  return (
                    <button
                      key={sub.cas}
                      onClick={() => setSelectedSubstance(sub)}
                      className={`w-full text-left p-3 flex transition-all flex-col items-start gap-1 ${
                        isSelected ? "bg-indigo-50/70 text-indigo-900 border-l-4 border-indigo-600" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between w-full items-start gap-1">
                        <span className="text-xs font-bold leading-tight">{sub.frenchName}</span>
                        <span className="text-[9px] font-bold font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded leading-none shrink-0">{sub.cas}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-500 font-medium">
                        <span className="font-mono">TWA: {sub.twa || "N/A"}</span>
                        <span>•</span>
                        <span>Ech: {sub.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SUBSTANCE DETAIL CARD (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {selectedSubstance ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-5 flex flex-col gap-4">
              {/* SUBSTANCE TOP CARD BANNER */}
              <div className="flex flex-col sm:flex-row pb-3 border-b border-slate-100 justify-between items-start gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Beaker className="w-4 h-4 text-indigo-600 shrink-0" /> {selectedSubstance.frenchName}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    Nom Anglais: <span className="italic font-bold text-slate-700">{selectedSubstance.name}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">CAS: {selectedSubstance.cas}</span>
                  {selectedSubstance.mw && (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[10px]">MM: {selectedSubstance.mw} g/mol</span>
                  )}
                </div>
              </div>

              {/* SUMMARY HIGHLIGHT BENTO BLOCK */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-lg p-3">
                  <span className="text-[9px] font-extrabold text-indigo-900 uppercase block tracking-wider mb-1">Seuils d'Exposition (TLV)</span>
                  <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-500">TWA (8 heures) :</span>
                      <span className="font-bold text-slate-900 font-mono">{selectedSubstance.twa || "Aucun"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">STEL (Court Terme / C) :</span>
                      <span className="font-bold text-slate-900 font-mono">{selectedSubstance.stel || "Aucun"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50/40 border border-purple-100/50 rounded-lg p-3">
                  <span className="text-[9px] font-extrabold text-purple-900 uppercase block tracking-wider mb-1">Effets de base / Cibles</span>
                  <p className="text-xs text-slate-700 font-bold font-sans line-clamp-2 leading-relaxed">
                    {selectedSubstance.basis}
                  </p>
                </div>
              </div>

              {/* NOTATIONS LIST */}
              {selectedSubstance.notations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-mono">Mentions Specifiques d'Exposition</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSubstance.notations.map((note) => {
                      let description = "";
                      let style = "bg-slate-100 text-slate-700 border-slate-200";
                      switch (note) {
                        case "Skin":
                          description = "Absorption cutanée possible";
                          style = "bg-amber-100/70 text-amber-900 border-amber-200";
                          break;
                        case "A1":
                          description = "Cancérogène humain confirmé";
                          style = "bg-rose-100 text-rose-900 border-rose-200";
                          break;
                        case "A2":
                          description = "Cancérogène humain suspecté";
                          style = "bg-rose-50 text-rose-800 border-rose-150";
                          break;
                        case "A3":
                          description = "Cancérogène animal confirmé";
                          style = "bg-rose-50 text-rose-800 border-rose-150";
                          break;
                        case "A4":
                          description = "Non quantifiable pour les humains";
                          style = "bg-slate-100 text-slate-700 border-slate-200";
                          break;
                        case "BEI":
                        case "BEIp":
                        case "BEIM":
                        case "BEIC":
                          description = "Dispose d'un Index Biologique d'Exposition (BEI)";
                          style = "bg-indigo-100 text-indigo-900 border-indigo-200";
                          break;
                        case "DSEN":
                          description = "Sensibilisant cutané";
                          style = "bg-violet-100 text-violet-900 border-violet-200";
                          break;
                        case "RSEN":
                          description = "Sensibilisant respiratoire";
                          style = "bg-violet-100 text-violet-900 border-violet-200";
                          break;
                        case "OTO":
                          description = "Ototoxique (augmente nocivité bruit)";
                          style = "bg-blue-100 text-blue-900 border-blue-200";
                          break;
                      }
                      return (
                        <div key={note} className={`px-2.5 py-1 text-xs border rounded-lg font-semibold flex items-center gap-1.5 ${style}`}>
                          <span className="font-extrabold uppercase font-mono tracking-wider">{note}</span>
                          {description && <span className="text-[10px] opacity-90 border-l pl-1.5 font-medium">{description}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BIOMONITORING / BEI GRID */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-mono">
                  🧪 Dosage Toxicologique Recommandé (Index Beis - ACGIH 2025)
                </span>
                
                {selectedSubstance.bei && selectedSubstance.bei.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSubstance.bei.map((item, idx) => (
                      <div key={idx} className="bg-indigo-50/50 border border-indigo-100/50 rounded-lg p-3 space-y-1.5">
                        <div className="flex justify-between flex-wrap gap-2 items-start">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                            <span className="text-xs font-extrabold text-indigo-950 font-sans">{item.determinant}</span>
                          </div>
                          <span className="text-xs bg-indigo-600 text-white font-mono font-bold px-2 py-0.5 rounded shadow-xs leading-none">
                            {item.value}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-slate-500 font-medium">
                          <div>
                            <span className="font-bold text-slate-600">Timing Prélèvement :</span> <span className="text-indigo-900">{item.samplingTime}</span>
                          </div>
                          {item.notations.length > 0 && (
                            <div>
                              <span className="font-bold text-slate-600">Notations BEI :</span>{" "}
                              <span className="text-indigo-950 font-bold uppercase font-mono tracking-wider">{item.notations.join(", ")}</span> (
                              {item.notations.includes("B") && "B = Taux de fond normal, "}
                              {item.notations.includes("Ns") && "Ns = Non spécifique"}
                              )
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg py-4 px-3 text-center text-xs text-slate-400 italic">
                    Aucun biomonitoring chimique spécifique prescrit pour ce produit par l'ACGIH.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl py-12 px-4 flex flex-col items-center justify-center text-center">
              <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-500">Sélectionnez une substance dans la liste de gauche pour afficher ses détails d'exposition.</p>
            </div>
          )}

          {/* ADDITIONAL RESOURCE FROM ACGIH GLOSSARY (ABBREVIATIONS, CLARIFICATIONS) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 sm:p-5 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider font-mono">
              <Info className="w-4 h-4 text-indigo-600" /> Glossaire Officiel &amp; Méthodes Préventives
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-600">
              <div className="space-y-2">
                <div className="flex gap-2 items-start">
                  <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-indigo-600 shrink-0" />
                  <div>
                    <strong className="text-slate-800 font-extrabold">TLV (Threshold Limit Value) :</strong>
                    <p className="font-medium text-[11px] text-slate-500">
                      Concentration de substances dans l'air avec laquelle on estime que presque tous les travailleurs peuvent être exposés jour après jour sans effets nocifs probables.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-indigo-600 shrink-0" />
                  <div>
                    <strong className="text-slate-800 font-extrabold">BEIs (Biological Exposure Indices) :</strong>
                    <p className="font-medium text-[11px] text-slate-500">
                      Indicateurs d'exposition mesurant la quantité cumulée d'un produit toxique chimique effectivement absorbé par l'organisme (dosé dans le sang, l'urine ou l'air expiré).
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2 items-start">
                  <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-indigo-600 shrink-0" />
                  <div>
                    <strong className="text-slate-800 font-extrabold">Notations de Cancérogénicité (A1 à A5) :</strong>
                    <ul className="list-disc leading-tight pl-4 text-[10px] space-y-0.5 text-slate-500 font-semibold pt-1">
                      <li><span className="font-black text-rose-700">A1</span> : Cancérogène humain confirmé</li>
                      <li><span className="font-black text-rose-700">A2</span> : Cancérogène humain suspecté</li>
                      <li><span className="font-black text-rose-700">A3</span> : Cancérogène animal confirmé</li>
                      <li><span className="font-black text-slate-700">A4</span> : Non classifiable chez l'humain</li>
                      <li><span className="font-black text-slate-700">A5</span> : Non suspecté d'être cancérogène</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-indigo-600 shrink-0" />
                  <div>
                    <strong className="text-slate-800 font-extrabold">Ventilation Industrielle &amp; Pic d'Exposition :</strong>
                    <p className="font-medium text-[11px] text-slate-500">
                      La limite à court terme (STEL ou C - plafond) ne doit jamais être dépassée même un court instant pour éviter toute altération neurologique ou respiratoire soudaine.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
