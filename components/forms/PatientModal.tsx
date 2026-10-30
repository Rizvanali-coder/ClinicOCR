"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, UserPlus, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPatientAction, updatePatientAction } from "@/actions/patients";
import { Patient } from "@/types";
import { toast } from "sonner";

const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(0, "Age must be positive").max(120, "Age must be reasonable"),
  gender: z.enum(["Male", "Female", "Other"]),
  phone: z.string().min(7, "Phone number must be at least 7 digits"),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patient: Patient) => void;
  initialData?: Patient | null;
}

export function PatientModal({ isOpen, onClose, onSuccess, initialData }: PatientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name,
          age: initialData.age,
          gender: (initialData.gender as any) || "Other",
          phone: initialData.phone,
        }
      : {
          name: "",
          age: 30,
          gender: "Male",
          phone: "",
        },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        const res = await updatePatientAction(initialData.id, data);
        if (res.success && res.patient) {
          toast.success("Patient record updated successfully");
          onSuccess?.(res.patient);
          onClose();
        } else {
          toast.error(res.error || "Failed to update patient");
        }
      } else {
        const res = await createPatientAction(data);
        if (res.success && res.patient) {
          toast.success("New patient registered successfully");
          reset();
          onSuccess?.(res.patient);
          onClose();
        } else {
          toast.error(res.error || "Failed to add patient");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-healthcare-100 flex items-center justify-center text-healthcare-700">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">
                {initialData ? "Edit Patient Information" : "Register New Patient"}
              </h3>
              <p className="text-xs text-slate-500">Provide personal & contact details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Full Name *
            </label>
            <Input
              {...register("name")}
              placeholder="e.g. Johnathan Doe"
              className={errors.name ? "border-red-500 focus:ring-red-500" : ""}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Age *
              </label>
              <Input
                type="number"
                {...register("age")}
                placeholder="45"
                className={errors.age ? "border-red-500 focus:ring-red-500" : ""}
              />
              {errors.age && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.age.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Gender *
              </label>
              <select
                {...register("gender")}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-healthcare-500 focus:border-healthcare-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Phone Number *
            </label>
            <Input
              {...register("phone")}
              placeholder="+1 (555) 000-0000"
              className={errors.phone ? "border-red-500 focus:ring-red-500" : ""}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone.message}</p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{initialData ? "Update Patient" : "Create Patient"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
