"use server";

import { revalidatePath } from "next/cache";
import { 
  getPatients, 
  getPatientById, 
  createPatient, 
  updatePatient, 
  deletePatient,
  getPrescriptions 
} from "@/db";
import { Patient } from "@/types";

export async function fetchPatientsAction(query?: string) {
  try {
    const list = await getPatients(query);
    return { success: true, data: list };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to fetch patients" };
  }
}

export async function fetchPatientDetailsAction(id: string) {
  try {
    const patient = await getPatientById(id);
    if (!patient) {
      return { success: false, error: "Patient not found" };
    }
    const prescriptions = await getPrescriptions({ patient_id: id });
    return { success: true, patient, prescriptions };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to fetch patient details" };
  }
}

export async function createPatientAction(data: {
  name: string;
  age: number;
  gender: string;
  phone: string;
}) {
  try {
    if (!data.name || !data.phone) {
      return { success: false, error: "Patient name and phone number are required" };
    }
    const created = await createPatient({
      name: data.name.trim(),
      age: Number(data.age) || 0,
      gender: data.gender || "Other",
      phone: data.phone.trim(),
    });
    revalidatePath("/patients");
    revalidatePath("/dashboard");
    revalidatePath("/upload");
    return { success: true, patient: created };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to create patient" };
  }
}

export async function updatePatientAction(
  id: string,
  data: Partial<Pick<Patient, "name" | "age" | "gender" | "phone">>
) {
  try {
    const updated = await updatePatient(id, data);
    revalidatePath("/patients");
    revalidatePath(`/patients/${id}`);
    revalidatePath("/dashboard");
    return { success: true, patient: updated };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update patient" };
  }
}

export async function deletePatientAction(id: string) {
  try {
    const deleted = await deletePatient(id);
    revalidatePath("/patients");
    revalidatePath("/dashboard");
    return { success: true, deleted };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete patient" };
  }
}
