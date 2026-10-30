"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  UserPlus, 
  Check, 
  AlertTriangle, 
  ArrowRight, 
  Save, 
  RefreshCw, 
  Star, 
  Pill, 
  Eye, 
  FileCode,
  Tag,
  Stethoscope,
  Info,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PatientModal } from "@/components/forms/PatientModal";
import { ImageQualityAlert } from "@/components/upload/ImageQualityAlert";
import { OCRConfidenceBadge } from "@/components/upload/OCRConfidenceBadge";
import { MedicineEditor } from "@/components/prescription/MedicineEditor";
import { fetchPatientsAction } from "@/actions/patients";
import { savePrescriptionAction } from "@/actions/prescriptions";
import { 
  Patient, 
  Medicine, 
  ImageQualityReport, 
  OCRConfidenceLevel, 
  GeminiAnalysisResult 
} from "@/types";
import { toast } from "sonner";

function UploadWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId");
  const sampleParam = searchParams.get("sample");

  // Patients state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || "");
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quality check state (Phase 2)
  const [qualityReport, setQualityReport] = useState<ImageQualityReport | null>(null);
  const [isCheckingQuality, setIsCheckingQuality] = useState(false);

  // Processing state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);

  // Pipeline output state
  const [rawOcr, setRawOcr] = useState<string>("");
  const [confidenceLevel, setConfidenceLevel] = useState<OCRConfidenceLevel>("Good");
  const [confidenceScore, setConfidenceScore] = useState<number>(85);
  const [uncertainWords, setUncertainWords] = useState<string[]>([]);

  // Doctor Review & Editable state
  const [correctedText, setCorrectedText] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [importantFindings, setImportantFindings] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [doctorNotes, setDoctorNotes] = useState<string>("");
  const [isImportant, setIsImportant] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load patients on mount
  useEffect(() => {
    async function loadPatients() {
      const res = await fetchPatientsAction();
      if (res.success && res.data) {
        setPatients(res.data);
        if (!selectedPatientId && res.data.length > 0) {
          setSelectedPatientId(res.data[0].id);
        }
      }
    }
    loadPatients();
  }, []);

  // Handle sample query param if provided
  useEffect(() => {
    if (sampleParam) {
      loadSample(sampleParam);
    }
  }, [sampleParam]);

  const loadSample = async (sampleNumber: string) => {
    try {
      const samplePath = `/samples/prescription-sample-${sampleNumber}.svg`;
      const res = await fetch(samplePath);
      const blob = await res.blob();
      const file = new File([blob], `sample-prescription-${sampleNumber}.svg`, { type: "image/svg+xml" });
      handleFileSelected(file);
      toast.info(`Loaded Sample Prescription #${sampleNumber}`);
    } catch (err) {
      console.warn("Failed to load sample:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setAnalysisCompleted(false);

    // Create object URL for instant preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);

    // Run instant Phase 2 Smart Quality Check
    runQualityCheck(file);
  };

  const runQualityCheck = async (file: File) => {
    setIsCheckingQuality(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("checkOnly", "true");

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.quality) {
        setQualityReport(data.quality);
      }
    } catch (err) {
      console.warn("Quality check error:", err);
    } finally {
      setIsCheckingQuality(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("Please upload a prescription image first");
      return;
    }
    if (!selectedPatientId) {
      toast.error("Please select a patient before analyzing");
      return;
    }

    setIsAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze prescription");
      }

      // Populate raw OCR output (preserved exactly)
      setRawOcr(data.raw_ocr || "");
      setConfidenceLevel(data.confidence || "Good");
      setConfidenceScore(data.confidenceScore || 80);
      setUncertainWords(data.uncertainWords || []);
      setQualityReport(data.quality || null);

      if (data.imageUrl) {
        setImagePreviewUrl(data.imageUrl);
      }

      // Populate AI-structured outputs for Doctor Review
      const ai: GeminiAnalysisResult = data.aiAnalysis;
      setCorrectedText(ai.corrected_text || data.raw_ocr || "");
      setSummary(ai.summary || "");
      setMedicines(ai.medicines || []);
      setImportantFindings(ai.important_findings || []);
      setTags(ai.tags || ["General"]);

      setAnalysisCompleted(true);
      toast.success("Prescription analyzed & structured successfully!");
    } catch (err: any) {
      toast.error(err.message || "Analysis error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(newTagInput.trim())) {
        setTags([...tags, newTagInput.trim()]);
      }
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!selectedPatientId) {
      toast.error("Please select a patient");
      return;
    }
    if (!correctedText) {
      toast.error("Prescription text cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const res = await savePrescriptionAction({
        patient_id: selectedPatientId,
        image_url: imagePreviewUrl || "/samples/prescription-sample-1.svg",
        raw_ocr: rawOcr,
        corrected_text: correctedText,
        ai_summary: summary,
        medicines_json: medicines,
        doctor_notes: doctorNotes,
        tags: tags,
        important: isImportant,
      });

      if (res.success && res.prescription) {
        toast.success("Prescription record saved to patient database!");
        router.push(`/prescriptions/${res.prescription.id}`);
      } else {
        toast.error(res.error || "Failed to save prescription");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save prescription");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Prescription Digitization Workspace</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-healthcare-100 text-healthcare-700">
              Dual-Stage AI
            </span>
          </h1>
          <p className="text-sm text-slate-500">
            Upload handwritten doctor prescriptions. Tesseract extracts raw text, Gemini Flash refines and structures it.
          </p>
        </div>

        {analysisCompleted && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Record...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save to Patient Record</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Step 1 & 2: Patient Selection & Upload Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Patient Selection Card */}
        <Card className="lg:col-span-5 bg-white border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-healthcare-600 text-white text-[11px] flex items-center justify-center font-bold">
                  1
                </span>
                <span>Select Patient</span>
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsNewPatientModalOpen(true)}
                className="text-xs text-healthcare-600 hover:text-healthcare-700 h-7 px-2"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                <span>Add New</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-healthcare-500 font-medium"
            >
              {patients.length === 0 ? (
                <option value="">No patients registered</option>
              ) : (
                patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.gender}, {p.age}y) &bull; {p.phone}
                  </option>
                ))
              )}
            </select>

            {selectedPatient && (
              <div className="p-3 rounded-lg bg-healthcare-50/70 border border-healthcare-100 flex items-center justify-between text-xs text-healthcare-900">
                <div>
                  <span className="font-semibold">{selectedPatient.name}</span>
                  <span className="text-slate-500 ml-1.5">
                    ({selectedPatient.gender}, {selectedPatient.age} yrs)
                  </span>
                </div>
                <span className="font-mono text-slate-600">{selectedPatient.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload & Trigger Card */}
        <Card className="lg:col-span-7 bg-white border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-healthcare-600 text-white text-[11px] flex items-center justify-center font-bold">
                  2
                </span>
                <span>Upload Prescription Image</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Samples:</span>
                <button
                  type="button"
                  onClick={() => loadSample("1")}
                  className="text-xs text-healthcare-600 hover:underline font-medium"
                >
                  Adult Rx
                </button>
                <span className="text-slate-300">&bull;</span>
                <button
                  type="button"
                  onClick={() => loadSample("2")}
                  className="text-xs text-healthcare-600 hover:underline font-medium"
                >
                  Pediatric Rx
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-healthcare-400 rounded-xl p-5 text-center cursor-pointer bg-slate-50/50 hover:bg-healthcare-50/30 transition group"
            >
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-healthcare-600 mx-auto mb-2 transition" />
              <p className="text-xs font-semibold text-slate-700">
                {selectedFile ? selectedFile.name : "Click to browse or drag & drop prescription photo"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supported: JPG, JPEG, PNG (Handwritten or Printed)
              </p>
            </div>

            {/* Smart Quality Alert (Phase 2) */}
            {qualityReport && <ImageQualityAlert quality={qualityReport} />}

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-500">
                {selectedFile ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Ready for analysis
                  </span>
                ) : (
                  <span>Select an image or click sample to test</span>
                )}
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={!selectedFile || isAnalyzing}
                className="gap-2 shadow-sm font-semibold"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing OCR &amp; Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Prescription</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step 3: Interactive Doctor Review Workspace */}
      {analysisCompleted && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-healthcare-600 text-white flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Doctor Review &amp; Verification Stage</h3>
                <p className="text-xs text-slate-600">
                  You have final editorial authority. Review, edit medicines, or update notes before saving. Nothing is saved automatically.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md self-end sm:self-auto"
            >
              <Save className="w-4 h-4" />
              <span>Confirm &amp; Save Record</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Original Prescription Image & Raw OCR */}
            <div className="lg:col-span-5 space-y-4">
              {/* Prescription Image Card */}
              <Card className="bg-white border-slate-200 overflow-hidden">
                <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-healthcare-600" />
                      <span>Original Prescription Image</span>
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      Source Preview
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 bg-slate-100 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-auto">
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Uploaded Prescription"
                      className="max-h-[460px] w-auto object-contain rounded shadow-sm border border-slate-300"
                    />
                  ) : (
                    <p className="text-xs text-slate-400">No image loaded</p>
                  )}
                </CardContent>
              </Card>

              {/* Raw OCR Output Card (PRD: Display Raw OCR Output. No modifications. Doctors should always be able to view original OCR output) */}
              <Card className="bg-white border-slate-200">
                <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-slate-600" />
                      <span>Raw Tesseract OCR Output (Unmodified)</span>
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      Stage 1 Engine
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {/* OCR Confidence Indicator (Phase 2) */}
                  <OCRConfidenceBadge
                    level={confidenceLevel}
                    score={confidenceScore}
                    uncertainWords={uncertainWords}
                  />

                  <div className="rounded-lg bg-slate-900 text-slate-100 p-3.5 font-mono text-xs overflow-auto max-h-56 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {rawOcr || "No raw text detected."}
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    Preserved strictly as extracted by Tesseract OCR before Gemini refinement.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Doctor Review & Structured Medical Intelligence */}
            <div className="lg:col-span-7 space-y-5">
              <Card className="bg-white border-slate-200 shadow-card">
                <CardHeader className="py-3 px-5 bg-gradient-to-r from-healthcare-50 to-white border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-healthcare-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-healthcare-600" />
                      <span>Gemini AI Structured Output &amp; Clinical Editor</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 cursor-pointer bg-amber-50 px-2 py-1 rounded-md border border-amber-200 hover:bg-amber-100 transition">
                        <input
                          type="checkbox"
                          checked={isImportant}
                          onChange={(e) => setIsImportant(e.target.checked)}
                          className="rounded text-amber-500 focus:ring-amber-400"
                        />
                        <Star className={`w-3.5 h-3.5 ${isImportant ? "fill-amber-400 text-amber-500" : "text-amber-500"}`} />
                        <span>⭐ Important</span>
                      </label>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-5">
                  {/* Corrected Text (Editable) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Corrected Prescription Text *
                    </label>
                    <textarea
                      value={correctedText}
                      onChange={(e) => setCorrectedText(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-slate-300 p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-healthcare-500 focus:border-healthcare-500 leading-relaxed"
                      placeholder="Doctor-verified prescription text..."
                    />
                  </div>

                  {/* AI Clinical Summary (Editable) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Clinical Summary (Diagnosis &amp; Plan)
                    </label>
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-healthcare-500"
                      placeholder="Concise clinical summary..."
                    />
                  </div>

                  {/* Smart Medicine Editor (Phase 2 Badges + Dosage + Frequency) */}
                  <div className="pt-2 border-t border-slate-100">
                    <MedicineEditor
                      medicines={medicines}
                      onChange={(updated) => setMedicines(updated)}
                    />
                  </div>

                  {/* Important Findings (Vitals, special warnings) */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Important Findings &amp; Clinical Vitals
                    </label>
                    <div className="space-y-1.5">
                      {importantFindings.map((finding, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800"
                        >
                          <span>&bull; {finding}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setImportantFindings(importantFindings.filter((_, i) => i !== idx))
                            }
                            className="text-slate-400 hover:text-red-500 text-xs font-bold"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tags (Phase 2: Fever, Antibiotic, Pediatric, etc.) */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Prescription Organization Tags
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 text-xs py-1 px-2.5 bg-slate-100 text-slate-800"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            &times;
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Input
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Type a tag (e.g. Fever, Antibiotic) and press Enter..."
                      className="h-8 text-xs max-w-sm"
                    />
                  </div>

                  {/* Doctor Notes (Phase 2 Requirement) */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Doctor Personal Notes &amp; Follow-up Instructions
                    </label>
                    <textarea
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-healthcare-500"
                      placeholder="e.g. Follow-up after 5 days, review fever, increase fluids..."
                    />
                  </div>

                  {/* Bottom Save Action */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-[11px] text-slate-500">
                      Saving writes to Neon PostgreSQL and pins to {selectedPatient?.name}&apos;s profile.
                    </p>

                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="gap-2 bg-healthcare-600 hover:bg-healthcare-700 text-white font-semibold"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Record</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* New Patient Registration Modal */}
      <PatientModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onSuccess={(created) => {
          setPatients((prev) => [created, ...prev]);
          setSelectedPatientId(created.id);
        }}
      />
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-healthcare-600" />
            <p className="text-sm font-medium">Loading Digitization Workspace...</p>
          </div>
        </div>
      }
    >
      <UploadWorkspace />
    </Suspense>
  );
}
