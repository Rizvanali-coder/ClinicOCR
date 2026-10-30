"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  Star, 
  User, 
  ChevronRight, 
  UploadCloud, 
  Pill,
  Tag,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchPrescriptionsAction, toggleImportantAction } from "@/actions/prescriptions";
import { Prescription } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [importantOnly, setImportantOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadPrescriptions = async () => {
    setIsLoading(true);
    const res = await fetchPrescriptionsAction({
      query: searchQuery,
      importantOnly: importantOnly,
    });
    if (res.success && res.data) {
      setPrescriptions(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadPrescriptions();
  }, [searchQuery, importantOnly]);

  const handleToggleImportant = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggleImportantAction(id);
    if (res.success) {
      toast.success(res.important ? "Marked as Important" : "Removed from Important");
      loadPrescriptions();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Prescription Records
          </h1>
          <p className="text-sm text-slate-500">
            Digitized, structured medical records searchable across patients and medications
          </p>
        </div>

        <Link href="/upload">
          <Button className="gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Digitize New Prescription</span>
          </Button>
        </Link>
      </div>

      {/* Search and Filters Bar (Phase 2 Requirement) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Patient Name, Phone, Medicine (e.g. Amoxicillin), or Tag..."
            className="pl-10 h-10 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        <button
          onClick={() => setImportantOnly(!importantOnly)}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition ${
            importantOnly
              ? "bg-amber-100 border-amber-300 text-amber-900 shadow-sm"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${importantOnly ? "fill-amber-500 text-amber-600" : "text-slate-400"}`} />
          <span>Important Only</span>
        </button>
      </div>

      {/* Prescription Cards List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : prescriptions.length === 0 ? (
        <Card className="p-12 text-center bg-white border-dashed border-slate-300">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No prescriptions found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No records found matching "${searchQuery}". Check the patient name or medicine spelling.`
              : "No prescriptions digitized yet. Upload and review a prescription to populate your records."}
          </p>
          <div className="mt-4">
            <Link href="/upload">
              <Button size="sm">
                <UploadCloud className="w-4 h-4 mr-1.5" />
                Upload Prescription
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <Link key={rx.id} href={`/prescriptions/${rx.id}`} className="block group">
              <Card
                className={`bg-white hover:border-healthcare-400 hover:shadow-subtle transition overflow-hidden ${
                  rx.important ? "border-amber-300/80 bg-amber-50/20" : ""
                }`}
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => handleToggleImportant(rx.id, e)}
                        title={rx.important ? "Unpin Important" : "Pin as Important"}
                        className="mt-0.5 text-slate-300 hover:text-amber-500 transition"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            rx.important ? "fill-amber-400 text-amber-500" : ""
                          }`}
                        />
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-healthcare-700 transition">
                            {rx.patient_name || "Unknown Patient"}
                          </span>
                          <span className="text-xs text-slate-400">&bull;</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDate(rx.created_at)}
                          </span>
                          {rx.important && (
                            <Badge variant="warning" className="text-[10px] py-0 px-2">
                              ⭐ Important
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-1 max-w-xl">
                          {rx.ai_summary || rx.corrected_text}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {rx.medicines_json?.map((m, idx) => (
                            <Badge
                              key={idx}
                              variant={m.name.toLowerCase().startsWith("possibly") ? "uncertainMedicine" : "medicine"}
                              className="text-[11px] py-0.5 px-2"
                            >
                              <span className="font-semibold">{m.name}</span>
                              {m.dosage && <span className="opacity-75 ml-1">({m.dosage})</span>}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {rx.tags?.slice(0, 2).map((t, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] hidden md:inline-flex">
                          {t}
                        </Badge>
                      ))}
                      <div className="flex items-center gap-1 text-xs font-semibold text-healthcare-600 group-hover:translate-x-1 transition">
                        <span>View</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
