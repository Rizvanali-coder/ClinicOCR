"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  FileText, 
  UploadCloud, 
  UserPlus, 
  Star, 
  ArrowRight, 
  Clock, 
  Activity, 
  ChevronRight,
  Sparkles,
  Search,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PatientModal } from "@/components/forms/PatientModal";
import { fetchDashboardStatsAction, toggleImportantAction } from "@/actions/prescriptions";
import { formatDate } from "@/lib/utils";
import { Prescription } from "@/types";
import { toast } from "sonner";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalPrescriptions: 0,
    importantPrescriptions: 0,
    recentPrescriptions: [] as Prescription[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const res = await fetchDashboardStatsAction();
    if (res.success && res.stats) {
      setStats(res.stats);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleImportant = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggleImportantAction(id);
    if (res.success) {
      toast.success(res.important ? "Marked as Important" : "Removed from Important");
      loadData();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-healthcare-700 via-healthcare-600 to-healthcare-800 text-white p-6 sm:p-8 rounded-2xl shadow-elevated">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Medical Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Clinic Prescription Digitizer</h1>
          <p className="text-sm sm:text-base text-healthcare-100 max-w-xl">
            Tesseract OCR text extraction + Google Gemini Flash clinical restructuring. Doctor reviewed and secured.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setIsAddPatientOpen(true)}
            variant="secondary"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-none font-semibold"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Patient
          </Button>

          <Link href="/upload">
            <Button className="bg-white text-healthcare-700 hover:bg-slate-100 font-bold shadow-md">
              <UploadCloud className="w-4 h-4 mr-2" />
              Quick Upload
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card className="hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Total Patients</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-healthcare-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
              ) : (
                stats.totalPatients
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Active clinical database</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Total Prescriptions</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
              ) : (
                stats.totalPrescriptions
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Digitized &amp; verified</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Important Prescriptions</CardTitle>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
              ) : (
                stats.importantPrescriptions
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-amber-500 font-medium">⭐ Pinned to top of history</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections: Recent Uploads & Quick Nav */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Uploads List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Prescription Uploads</h2>
              <p className="text-xs text-slate-500">Latest digitized prescriptions reviewed by doctor</p>
            </div>
            <Link
              href="/prescriptions"
              className="text-xs font-semibold text-healthcare-600 hover:text-healthcare-700 flex items-center gap-1 group"
            >
              <span>View all records</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : stats.recentPrescriptions.length === 0 ? (
            <Card className="p-8 text-center bg-white border-dashed border-slate-300">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-700 text-sm">No prescriptions digitized yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Upload your first handwritten prescription image to experience automated OCR and Gemini structuring.
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
              {stats.recentPrescriptions.map((rx) => (
                <Link
                  key={rx.id}
                  href={`/prescriptions/${rx.id}`}
                  className="block group"
                >
                  <Card className="hover:border-healthcare-300 hover:shadow-subtle transition bg-white overflow-hidden">
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => handleToggleImportant(rx.id, e)}
                          title={rx.important ? "Important record" : "Mark as important"}
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
                            <span className="font-semibold text-sm text-slate-900 group-hover:text-healthcare-700 transition">
                              {rx.patient_name || "Patient Record"}
                            </span>
                            <span className="text-xs text-slate-400">&bull;</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {formatDate(rx.created_at)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-1 max-w-md">
                            {rx.ai_summary || rx.corrected_text}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {rx.medicines_json?.slice(0, 3).map((m, idx) => (
                              <Badge key={idx} variant="medicine" className="text-[11px] py-0 px-2 font-normal">
                                {m.name}
                              </Badge>
                            ))}
                            {(rx.medicines_json?.length || 0) > 3 && (
                              <span className="text-[10px] text-slate-400 self-center">
                                +{(rx.medicines_json?.length || 0) - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {rx.tags?.slice(0, 1).map((t, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-healthcare-600 group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Shortcuts & System Info */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="w-8 h-8 rounded-lg bg-healthcare-500/20 text-healthcare-400 flex items-center justify-center mb-1">
                <Sparkles className="w-4 h-4" />
              </div>
              <CardTitle className="text-base font-bold text-white">How ClinicOCR Works</CardTitle>
              <CardDescription className="text-xs text-slate-300">
                A dual-stage medical intelligence workflow:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  <strong>Preprocess &amp; Tesseract OCR:</strong> Cleans noise, corrects rotation, extracts raw character matrix.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  <strong>Google Gemini Flash:</strong> Fixes medical typos, extracts medicines, dosage, and frequency into JSON.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  <strong>Doctor Review:</strong> You retain complete editorial control. Nothing is saved until confirmed.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 bg-healthcare-50/60 border border-healthcare-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-healthcare-900 mb-2">
              Ready-to-Test Sample Prescriptions
            </h4>
            <p className="text-xs text-healthcare-700 mb-3">
              Don&apos;t have a paper prescription right now? Use one of our realistic clinic samples:
            </p>
            <div className="space-y-2">
              <Link
                href="/upload?sample=1"
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-healthcare-200 hover:border-healthcare-400 text-xs font-semibold text-slate-800 transition group shadow-subtle"
              >
                <span>Sample 1: Adult Infection (Amoxicillin)</span>
                <ArrowRight className="w-3.5 h-3.5 text-healthcare-600 group-hover:translate-x-1 transition" />
              </Link>
              <Link
                href="/upload?sample=2"
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-healthcare-200 hover:border-healthcare-400 text-xs font-semibold text-slate-800 transition group shadow-subtle"
              >
                <span>Sample 2: Pediatric Bronchitis (Levolin)</span>
                <ArrowRight className="w-3.5 h-3.5 text-healthcare-600 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <PatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
