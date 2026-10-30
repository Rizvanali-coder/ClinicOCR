"use client";

import React from "react";
import { Plus, Trash2, Pill, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Medicine } from "@/types";

interface MedicineEditorProps {
  medicines: Medicine[];
  onChange: (medicines: Medicine[]) => void;
}

export function MedicineEditor({ medicines, onChange }: MedicineEditorProps) {
  const handleUpdate = (index: number, field: keyof Medicine, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([
      ...medicines,
      {
        name: "",
        dosage: "500mg",
        frequency: "1-0-1 (After food)",
      },
    ]);
  };

  const handleRemove = (index: number) => {
    const updated = medicines.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Pill className="w-4 h-4 text-healthcare-600" />
            <span>Extracted Medicines ({medicines.length})</span>
          </h4>
          <p className="text-[11px] text-slate-500">
            Smart recognition badges. Verify or modify dosage and frequency below.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleAdd}
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1 border-healthcare-200 text-healthcare-700 hover:bg-healthcare-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Medicine</span>
        </Button>
      </div>

      {/* Smart Medicine Badges (Phase 2 Requirement) */}
      {medicines.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          {medicines.map((m, idx) => {
            const isUncertain = m.name.toLowerCase().startsWith("possibly");
            return (
              <Badge
                key={idx}
                variant={isUncertain ? "uncertainMedicine" : "medicine"}
                className="text-xs py-1 px-2.5 gap-1.5 cursor-default transition"
              >
                {isUncertain ? (
                  <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                ) : (
                  <Sparkles className="w-3 h-3 text-healthcare-600 shrink-0" />
                )}
                <span className="font-semibold">{m.name || "Untitled Medicine"}</span>
                {m.dosage && <span className="opacity-80 font-normal">| {m.dosage}</span>}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Editable rows */}
      <div className="space-y-2.5">
        {medicines.map((med, index) => {
          const isUncertain = med.name.toLowerCase().startsWith("possibly");
          return (
            <div
              key={index}
              className={`p-3 rounded-xl border transition space-y-2 bg-white ${
                isUncertain
                  ? "border-amber-300 bg-amber-50/20 shadow-sm"
                  : "border-slate-200 shadow-subtle"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Item #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Remove medication"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                    Medicine Name
                  </label>
                  <Input
                    value={med.name}
                    onChange={(e) => handleUpdate(index, "name", e.target.value)}
                    placeholder="e.g. Amoxicillin or Tab Paracetamol"
                    className="h-8 text-xs font-medium"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                    Dosage / Strength
                  </label>
                  <Input
                    value={med.dosage}
                    onChange={(e) => handleUpdate(index, "dosage", e.target.value)}
                    placeholder="e.g. 500mg, 5ml"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                    Frequency / Instructions
                  </label>
                  <Input
                    value={med.frequency}
                    onChange={(e) => handleUpdate(index, "frequency", e.target.value)}
                    placeholder="e.g. 1-0-1, TDS, SOS"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
