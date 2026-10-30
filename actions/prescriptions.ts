"use server";

import { revalidatePath } from "next/cache";
import { 
  createPrescription, 
  getPrescriptions, 
  getPrescriptionById, 
  togglePrescriptionImportant, 
  updatePrescriptionNotes, 
  deletePrescription,
  getDashboardStats
} from "@/db";
import { Medicine, Prescription } from "@/types";

export async function fetchPrescriptionsAction(options?: {
  patient_id?: string;
  query?: string;
  importantOnly?: boolean;
}) {
  try {
    const list = await getPrescriptions(options);
    return { success: true, data: list };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to fetch prescriptions" };
  }
}

export async function fetchPrescriptionDetailAction(id: string) {
  try {
    const prescription = await getPrescriptionById(id);
    if (!prescription) {
      return { success: false, error: "Prescription not found" };
    }
    return { success: true, data: prescription };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to fetch prescription details" };
  }
}

export async function savePrescriptionAction(payload: {
  patient_id: string;
  image_url: string;
  raw_ocr: string;
  corrected_text: string;
  ai_summary: string;
  medicines_json: Medicine[];
  doctor_notes?: string;
  tags?: string[];
  important?: boolean;
}) {
  try {
    if (!payload.patient_id) {
      return { success: false, error: "Patient must be selected before saving" };
    }
    if (!payload.corrected_text) {
      return { success: false, error: "Prescription text is empty" };
    }

    const prescription = await createPrescription({
      patient_id: payload.patient_id,
      image_url: payload.image_url,
      raw_ocr: payload.raw_ocr,
      corrected_text: payload.corrected_text,
      ai_summary: payload.ai_summary,
      medicines_json: payload.medicines_json,
      doctor_notes: payload.doctor_notes || null,
      tags: payload.tags || [],
      important: payload.important || false,
    });

    revalidatePath("/dashboard");
    revalidatePath("/prescriptions");
    revalidatePath(`/patients/${payload.patient_id}`);

    return { success: true, prescription };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to save prescription" };
  }
}

export async function toggleImportantAction(id: string, patient_id?: string) {
  try {
    const nextVal = await togglePrescriptionImportant(id);
    revalidatePath("/dashboard");
    revalidatePath("/prescriptions");
    if (patient_id) revalidatePath(`/patients/${patient_id}`);
    revalidatePath(`/prescriptions/${id}`);
    return { success: true, important: nextVal };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update record" };
  }
}

export async function updateNotesAction(id: string, notes: string) {
  try {
    await updatePrescriptionNotes(id, notes);
    revalidatePath(`/prescriptions/${id}`);
    revalidatePath("/prescriptions");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to save doctor notes" };
  }
}

export async function deletePrescriptionAction(id: string, patient_id?: string) {
  try {
    await deletePrescription(id);
    revalidatePath("/dashboard");
    revalidatePath("/prescriptions");
    if (patient_id) revalidatePath(`/patients/${patient_id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete prescription" };
  }
}

export async function fetchDashboardStatsAction() {
  try {
    const stats = await getDashboardStats();
    return { success: true, stats };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to fetch dashboard stats" };
  }
}
