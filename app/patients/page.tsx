"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  User, 
  FileText, 
  ChevronRight, 
  Edit, 
  Trash2, 
  UploadCloud,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PatientModal } from "@/components/forms/PatientModal";
import { fetchPatientsAction, deletePatientAction } from "@/actions/patients";
import { Patient } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const loadPatients = async (query = "") => {
    setIsLoading(true);
    const res = await fetchPatientsAction(query);
    if (res.success && res.data) {
      setPatients(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadPatients(searchQuery);
  }, [searchQuery]);

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete patient "${name}" and all their associated prescription records?`)) {
      const res = await deletePatientAction(id);
      if (res.success) {
        toast.success(`Patient ${name} removed`);
        loadPatients(searchQuery);
      } else {
        toast.error(res.error || "Failed to delete patient");
      }
    }
  };

  const handleEdit = (p: Patient, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPatient(p);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Patient Management</h1>
          <p className="text-sm text-slate-500">
            Search, manage records, and access patient-wise prescription histories
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingPatient(null);
            setIsModalOpen(true);
          }}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Patient</span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by patient name or phone number..."
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

      {/* Patients List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <Card className="p-12 text-center bg-white border-dashed border-slate-300">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No patients found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No records matching "${searchQuery}". Try a different name or phone number.`
              : "Register your first clinic patient to begin logging digitized prescriptions."}
          </p>
          <div className="mt-4">
            <Button
              onClick={() => {
                setEditingPatient(null);
                setIsModalOpen(true);
              }}
              size="sm"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Add First Patient
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((p) => (
            <Link key={p.id} href={`/patients/${p.id}`} className="block group">
              <Card className="h-full hover:border-healthcare-400 hover:shadow-subtle transition bg-white flex flex-col justify-between overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-healthcare-50 text-healthcare-700 font-bold flex items-center justify-center border border-healthcare-200">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-healthcare-700 transition line-clamp-1">
                          {p.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span>{p.gender}</span>
                          <span>&bull;</span>
                          <span>{p.age} yrs</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEdit(p, e)}
                        title="Edit Patient"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(p.id, p.name, e)}
                        title="Delete Patient"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">{p.phone}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Registered: {formatDate(p.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-healthcare-600 group-hover:text-healthcare-700">
                  <span>View Prescription History</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <PatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingPatient}
        onSuccess={() => loadPatients(searchQuery)}
      />
    </div>
  );
}
