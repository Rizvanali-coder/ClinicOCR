"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Download, 
  Star, 
  FileText, 
  Pill, 
  Eye, 
  Sparkles, 
  Save, 
  Trash2, 
  Tag, 
  FileCode,
  CheckCircle,
  Clock,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  fetchPrescriptionDetailAction, 
  toggleImportantAction, 
  updateNotesAction, 
  deletePrescriptionAction 
} from "@/actions/prescriptions";
import { Prescription } from "@/types";
import { formatDate } from "@/lib/utils";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PrescriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"structured" | "raw">("structured");
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const res = await fetchPrescriptionDetailAction(id);
    if (res.success && res.data) {
      setPrescription(res.data);
      setNotes(res.data.doctor_notes || "");
    } else {
      toast.error(res.error || "Failed to load prescription record");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleImportant = async () => {
    if (!prescription) return;
    const res = await toggleImportantAction(prescription.id, prescription.patient_id);
    if (res.success) {
      setPrescription({ ...prescription, important: res.important ?? false });
      toast.success(res.important ? "Marked as Important" : "Removed from Important");
    }
  };

  const handleSaveNotes = async () => {
    if (!prescription) return;
    setIsSavingNotes(true);
    const res = await updateNotesAction(prescription.id, notes);
    if (res.success) {
      setPrescription({ ...prescription, doctor_notes: notes });
      toast.success("Doctor notes updated successfully");
    } else {
      toast.error(res.error || "Failed to update notes");
    }
    setIsSavingNotes(false);
  };

  const handleDelete = async () => {
    if (!prescription) return;
    if (confirm("Are you sure you want to permanently delete this prescription record?")) {
      const res = await deletePrescriptionAction(prescription.id, prescription.patient_id);
      if (res.success) {
        toast.success("Prescription record deleted");
        router.push(prescription.patient_id ? `/patients/${prescription.patient_id}` : "/prescriptions");
      } else {
        toast.error(res.error || "Failed to delete");
      }
    }
  };

  // Phase 2 Requirement: Download Report (Export as PDF)
  // Includes: Corrected Text, AI Summary, Medicines, Doctor Notes
  const handleExportPDF = () => {
    if (!prescription) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Header Banner
      doc.setFillColor(12, 135, 235); // Healthcare blue
      doc.rect(0, 0, 210, 28, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("ClinicOCR - Medical Prescription Report", 14, 18);

      // Meta Information
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);

      let yPos = 38;
      doc.text(`Patient: ${prescription.patient_name || "N/A"}`, 14, yPos);
      doc.text(`Date: ${formatDate(prescription.created_at)}`, 140, yPos);
      yPos += 7;
      doc.text(`Patient ID: ${prescription.patient_id}`, 14, yPos);
      doc.text(`Record ID: ${prescription.id}`, 140, yPos);

      // Divider line
      yPos += 5;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(14, yPos, 196, yPos);

      // Section: AI Clinical Summary
      yPos += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(12, 135, 235);
      doc.text("1. Clinical AI Summary", 14, yPos);

      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const splitSummary = doc.splitTextToSize(prescription.ai_summary || "No summary recorded.", 180);
      doc.text(splitSummary, 14, yPos);
      yPos += splitSummary.length * 5 + 6;

      // Section: Prescribed Medicines Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(12, 135, 235);
      doc.text("2. Prescribed Medications", 14, yPos);
      yPos += 6;

      // Medicines table header
      doc.setFillColor(240, 245, 250);
      doc.rect(14, yPos, 182, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text("Medicine Name", 18, yPos + 5);
      doc.text("Dosage", 95, yPos + 5);
      doc.text("Frequency & Instructions", 140, yPos + 5);
      yPos += 9;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      prescription.medicines_json.forEach((med, i) => {
        doc.text(`${i + 1}. ${med.name}`, 18, yPos);
        doc.text(med.dosage || "As directed", 95, yPos);
        doc.text(med.frequency || "Daily", 140, yPos);
        yPos += 6;
      });

      yPos += 4;

      // Section: Doctor Notes
      if (prescription.doctor_notes) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(12, 135, 235);
        doc.text("3. Doctor's Personal Notes & Instructions", 14, yPos);
        yPos += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const splitNotes = doc.splitTextToSize(prescription.doctor_notes, 180);
        doc.text(splitNotes, 14, yPos);
        yPos += splitNotes.length * 5 + 6;
      }

      // Section: Full Corrected Text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(12, 135, 235);
      doc.text("4. Full Corrected Prescription Text", 14, yPos);
      yPos += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(70, 70, 70);
      const splitText = doc.splitTextToSize(prescription.corrected_text || "", 180);
      doc.text(splitText, 14, yPos);
      yPos += splitText.length * 5 + 14;

      // Footer disclaimer & signature line
      doc.setDrawColor(180, 180, 180);
      doc.line(140, 260, 195, 260);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text("Attending Physician Signature", 140, 266);

      doc.setFontSize(8);
      doc.text(
        "Digitized with ClinicOCR • Verified by Attending Medical Practitioner",
        14,
        285
      );

      doc.save(`Prescription_${prescription.patient_name?.replace(/\s+/g, "_") || "Record"}_${prescription.id}.pdf`);
      toast.success("Prescription PDF downloaded successfully");
    } catch (err: any) {
      toast.error("Failed to generate PDF: " + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded" />
        <div className="h-64 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Prescription Not Found</h2>
        <p className="text-sm text-slate-500">The requested record does not exist or was removed.</p>
        <Link href="/prescriptions">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Records
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={prescription.patient_id ? `/patients/${prescription.patient_id}` : "/prescriptions"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient History</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleToggleImportant}
            variant="outline"
            size="sm"
            className={`gap-1.5 ${
              prescription.important ? "bg-amber-50 border-amber-300 text-amber-900" : ""
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                prescription.important ? "fill-amber-400 text-amber-500" : "text-slate-400"
              }`}
            />
            <span>{prescription.important ? "Important Record" : "Mark as Important"}</span>
          </Button>

          <Button onClick={handleExportPDF} size="sm" className="gap-1.5 shadow-sm">
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </Button>

          <Button onClick={handleDelete} variant="destructive" size="sm" className="gap-1.5">
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Header Card */}
      <Card className="bg-white border-slate-200 shadow-card">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-healthcare-50 text-healthcare-700 flex items-center justify-center border border-healthcare-200">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">
                    Prescription for {prescription.patient_name || "Patient Record"}
                  </h1>
                  {prescription.important && (
                    <Badge variant="warning" className="text-xs">
                      ⭐ Important
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Prescribed: {formatDate(prescription.created_at)}
                  </span>
                  <span>&bull;</span>
                  <span className="font-mono text-slate-600">ID: {prescription.id}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {prescription.tags?.map((t, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          {/* Quick summary strip */}
          <div className="mt-4 p-3.5 rounded-xl bg-healthcare-50/60 border border-healthcare-100">
            <span className="text-xs font-bold uppercase tracking-wider text-healthcare-900 block mb-1">
              Clinical Summary
            </span>
            <p className="text-xs sm:text-sm text-healthcare-950 leading-relaxed font-medium">
              {prescription.ai_summary}
            </p>
          </div>
        </div>
      </Card>

      {/* Detail Layout: Left column Original Image, Right column Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Original Prescription Image */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-white border-slate-200 overflow-hidden">
            <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-healthcare-600" />
                <span>Original Scanned Prescription</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 bg-slate-100 flex items-center justify-center min-h-[350px] max-h-[550px] overflow-auto">
              {prescription.image_url ? (
                <img
                  src={prescription.image_url}
                  alt="Original Prescription"
                  className="max-h-[500px] w-auto object-contain rounded shadow-sm border border-slate-300"
                />
              ) : (
                <p className="text-xs text-slate-400">No image archive found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Structured Medicines, Doctor Notes, & Raw OCR */}
        <div className="lg:col-span-7 space-y-5">
          {/* Tabs for Structured Intelligence vs Raw OCR */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab("structured")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "structured"
                  ? "bg-healthcare-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              Structured Clinical View
            </button>
            <button
              onClick={() => setActiveTab("raw")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "raw"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Original Raw OCR Output</span>
            </button>
          </div>

          {activeTab === "structured" ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Medicines List */}
              <Card className="bg-white border-slate-200 shadow-card">
                <CardHeader className="py-3 px-5 border-b border-slate-100">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-healthcare-600" />
                    <span>Prescribed Medications ({prescription.medicines_json?.length || 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {prescription.medicines_json?.map((med, idx) => {
                    const isUncertain = med.name.toLowerCase().startsWith("possibly");
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isUncertain
                            ? "bg-amber-50/40 border-amber-300"
                            : "bg-blue-50/30 border-blue-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {med.name}
                            </span>
                            {isUncertain && (
                              <Badge variant="warning" className="text-[10px]">
                                Uncertain OCR
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                            Dosage: {med.dosage || "As prescribed"}
                          </span>
                        </div>

                        <div className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-healthcare-700 self-start sm:self-auto shadow-subtle">
                          {med.frequency}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Full Corrected Text */}
              <Card className="bg-white border-slate-200 shadow-card">
                <CardHeader className="py-3 px-5 border-b border-slate-100">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Verified Corrected Text
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <pre className="text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    {prescription.corrected_text}
                  </pre>
                </CardContent>
              </Card>

              {/* Doctor Personal Notes (Phase 2 Requirement) */}
              <Card className="bg-white border-slate-200 shadow-card">
                <CardHeader className="py-3 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Doctor Notes &amp; Follow-up Instructions
                  </CardTitle>
                  <Button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-healthcare-200 text-healthcare-700"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Notes</span>
                  </Button>
                </CardHeader>
                <CardContent className="p-5 space-y-2">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Enter personal instructions, follow-up timelines, dietary notes..."
                    className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-healthcare-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Notes saved here appear on exported patient reports.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Raw Tesseract OCR Output (PRD Stage 1 engine raw output preserved without modification) */
            <div className="space-y-4 animate-in fade-in duration-200">
              <Card className="bg-white border-slate-200 shadow-card">
                <CardHeader className="py-3 px-5 bg-slate-900 text-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-healthcare-400" />
                      <span>Original Unmodified Tesseract OCR Text</span>
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] text-white border-white/30">
                      Phase 1 Stage 1
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <p className="text-xs text-slate-500">
                    This text represents the exact raw output extracted by the Tesseract OCR engine before Gemini AI correction was applied.
                  </p>
                  <div className="p-4 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {prescription.raw_ocr || "No raw OCR text recorded."}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
