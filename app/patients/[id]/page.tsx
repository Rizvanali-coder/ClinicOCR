"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Calendar, 
  FileText, 
  UploadCloud, 
  Star, 
  ChevronRight, 
  Clock, 
  Sparkles,
  Edit,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PatientModal } from "@/components/forms/PatientModal";
import { fetchPatientDetailsAction } from "@/actions/patients";
import { toggleImportantAction } from "@/actions/prescriptions";
import { Patient, Prescription } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const res = await fetchPatientDetailsAction(id);
    if (res.success && res.patient) {
      setPatient(res.patient);
      setPrescriptions(res.prescriptions || []);
    } else {
      toast.error(res.error || "Failed to load patient records");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleImportant = async (rxId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggleImportantAction(rxId, id);
    if (res.success) {
      toast.success(res.important ? "Record pinned as Important" : "Removed from Important");
      loadData();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded" />
        <div className="h-44 bg-white rounded-xl border border-slate-200" />
        <div className="h-64 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Patient Record Not Found</h2>
        <p className="text-sm text-slate-500">The requested patient does not exist or was deleted.</p>
        <Link href="/patients">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Patients
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <Link
          href="/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Patients</span>
        </Link>
      </div>

      {/* Patient Profile Card */}
      <Card className="bg-white border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-healthcare-600 text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-healthcare-600/20">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
                <Badge variant="outline" className="text-xs">
                  {patient.gender}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {patient.age} years old
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {patient.phone}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Registered {formatDate(patient.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Info</span>
            </Button>

            <Link href={`/upload?patientId=${patient.id}`}>
              <Button size="sm" className="gap-1.5 shadow-sm">
                <UploadCloud className="w-4 h-4" />
                <span>Upload Prescription</span>
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Prescriptions History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Prescription History ({prescriptions.length})
            </h2>
            <p className="text-xs text-slate-500">
              Chronological medical history. Important prescriptions are pinned to the top.
            </p>
          </div>
        </div>

        {prescriptions.length === 0 ? (
          <Card className="p-10 text-center bg-white border-dashed border-slate-300">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No prescriptions recorded yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Digitize handwritten doctor prescriptions for {patient.name} to establish their searchable digital timeline.
            </p>
            <div className="mt-4">
              <Link href={`/upload?patientId=${patient.id}`}>
                <Button size="sm">
                  <UploadCloud className="w-4 h-4 mr-1.5" />
                  Upload First Prescription
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx) => (
              <Link key={rx.id} href={`/prescriptions/${rx.id}`} className="block group">
                <Card className={`bg-white hover:border-healthcare-400 hover:shadow-subtle transition overflow-hidden ${
                  rx.important ? "border-amber-300/80 bg-amber-50/20" : ""
                }`}>
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleToggleImportant(rx.id, e)}
                          title={rx.important ? "Unpin Important" : "Pin as Important"}
                          className="text-slate-300 hover:text-amber-500 transition"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              rx.important ? "fill-amber-400 text-amber-500" : ""
                            }`}
                          />
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            Prescription from {formatDate(rx.created_at)}
                          </span>
                          {rx.important && (
                            <Badge variant="warning" className="text-[10px] gap-1">
                              <Star className="w-3 h-3 fill-amber-500" />
                              <span>Important</span>
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-healthcare-600 font-semibold group-hover:text-healthcare-700">
                        <span>View Details</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </div>
                    </div>

                    <div className="mt-3.5 space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Clinical Summary
                        </span>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {rx.ai_summary}
                        </p>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                          Extracted Medicines ({rx.medicines_json?.length || 0})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {rx.medicines_json?.map((m, idx) => (
                            <div
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-center gap-1.5"
                            >
                              <span className="font-semibold">{m.name}</span>
                              <span className="text-blue-700/80">({m.dosage})</span>
                              <span className="text-[10px] text-blue-600 bg-blue-100/70 px-1 rounded">
                                {m.frequency}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {rx.doctor_notes && (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                          <span className="font-semibold text-slate-900 block mb-0.5">Doctor Notes:</span>
                          {rx.doctor_notes}
                        </div>
                      )}

                      {rx.tags && rx.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {rx.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <PatientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={patient}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
