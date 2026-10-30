import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, ilike, or } from "drizzle-orm";
import * as schema from "./schema";
import { Patient, Prescription, Medicine } from "@/types";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_mg8uhsSXCAB4@ep-proud-mountain-b4ad7giy-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require";

// Initialize Neon HTTP connection
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

/**
 * Fetch patients directly from Neon PostgreSQL
 */
export async function getPatients(query?: string): Promise<Patient[]> {
  try {
    let rows;
    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      rows = await db
        .select()
        .from(schema.patients)
        .where(
          or(
            ilike(schema.patients.name, q),
            ilike(schema.patients.phone, q)
          )
        )
        .orderBy(desc(schema.patients.created_at));
    } else {
      rows = await db
        .select()
        .from(schema.patients)
        .orderBy(desc(schema.patients.created_at));
    }

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      age: r.age,
      gender: r.gender,
      phone: r.phone,
      created_at: r.created_at.toISOString(),
    }));
  } catch (error) {
    console.error("Neon DB error in getPatients:", error);
    return [];
  }
}

/**
 * Fetch patient by ID
 */
export async function getPatientById(id: string): Promise<Patient | null> {
  try {
    const rows = await db
      .select()
      .from(schema.patients)
      .where(eq(schema.patients.id, id));

    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      age: r.age,
      gender: r.gender,
      phone: r.phone,
      created_at: r.created_at.toISOString(),
    };
  } catch (error) {
    console.error("Neon DB error in getPatientById:", error);
    return null;
  }
}

/**
 * Register a new patient into Neon PostgreSQL
 */
export async function createPatient(data: {
  name: string;
  age: number;
  gender: string;
  phone: string;
}): Promise<Patient> {
  const [inserted] = await db
    .insert(schema.patients)
    .values({
      name: data.name,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
    })
    .returning();

  return {
    id: inserted.id,
    name: inserted.name,
    age: inserted.age,
    gender: inserted.gender,
    phone: inserted.phone,
    created_at: inserted.created_at.toISOString(),
  };
}

/**
 * Update patient in Neon PostgreSQL
 */
export async function updatePatient(
  id: string,
  data: Partial<Pick<Patient, "name" | "age" | "gender" | "phone">>
): Promise<Patient | null> {
  const [updated] = await db
    .update(schema.patients)
    .set(data)
    .where(eq(schema.patients.id, id))
    .returning();

  if (!updated) return null;

  return {
    id: updated.id,
    name: updated.name,
    age: updated.age,
    gender: updated.gender,
    phone: updated.phone,
    created_at: updated.created_at.toISOString(),
  };
}

/**
 * Delete patient and cascade prescriptions in Neon PostgreSQL
 */
export async function deletePatient(id: string): Promise<boolean> {
  await db.delete(schema.patients).where(eq(schema.patients.id, id));
  return true;
}

/**
 * Query prescriptions from Neon PostgreSQL with join on patients
 */
export async function getPrescriptions(options?: {
  patient_id?: string;
  query?: string;
  importantOnly?: boolean;
}): Promise<Prescription[]> {
  try {
    let rows = await db
      .select({
        id: schema.prescriptions.id,
        patient_id: schema.prescriptions.patient_id,
        patient_name: schema.patients.name,
        patient_phone: schema.patients.phone,
        image_url: schema.prescriptions.image_url,
        raw_ocr: schema.prescriptions.raw_ocr,
        corrected_text: schema.prescriptions.corrected_text,
        ai_summary: schema.prescriptions.ai_summary,
        medicines_json: schema.prescriptions.medicines_json,
        doctor_notes: schema.prescriptions.doctor_notes,
        tags: schema.prescriptions.tags,
        important: schema.prescriptions.important,
        created_at: schema.prescriptions.created_at,
      })
      .from(schema.prescriptions)
      .leftJoin(schema.patients, eq(schema.prescriptions.patient_id, schema.patients.id))
      .orderBy(
        desc(schema.prescriptions.important),
        desc(schema.prescriptions.created_at)
      );

    let list: Prescription[] = rows.map((r) => ({
      id: r.id,
      patient_id: r.patient_id,
      patient_name: r.patient_name || "Unknown Patient",
      patient_phone: r.patient_phone || "",
      image_url: r.image_url,
      raw_ocr: r.raw_ocr,
      corrected_text: r.corrected_text,
      ai_summary: r.ai_summary,
      medicines_json: (r.medicines_json as Medicine[]) || [],
      doctor_notes: r.doctor_notes,
      tags: (r.tags as string[]) || [],
      important: r.important,
      created_at: r.created_at.toISOString(),
    }));

    if (options?.patient_id) {
      list = list.filter((rx) => rx.patient_id === options.patient_id);
    }

    if (options?.importantOnly) {
      list = list.filter((rx) => rx.important);
    }

    if (options?.query && options.query.trim()) {
      const q = options.query.toLowerCase();
      list = list.filter((rx) => {
        const matchPatient =
          rx.patient_name?.toLowerCase().includes(q) ||
          rx.patient_phone?.includes(q);
        const matchMedicines = rx.medicines_json.some((m) =>
          m.name.toLowerCase().includes(q)
        );
        const matchTags = rx.tags?.some((t) => t.toLowerCase().includes(q));
        const matchSummary = rx.ai_summary.toLowerCase().includes(q);
        const matchNotes = rx.doctor_notes?.toLowerCase().includes(q);
        return matchPatient || matchMedicines || matchTags || matchSummary || matchNotes;
      });
    }

    return list;
  } catch (error) {
    console.error("Neon DB error in getPrescriptions:", error);
    return [];
  }
}

/**
 * Fetch prescription detail by ID
 */
export async function getPrescriptionById(id: string): Promise<Prescription | null> {
  try {
    const rows = await db
      .select({
        id: schema.prescriptions.id,
        patient_id: schema.prescriptions.patient_id,
        patient_name: schema.patients.name,
        patient_phone: schema.patients.phone,
        image_url: schema.prescriptions.image_url,
        raw_ocr: schema.prescriptions.raw_ocr,
        corrected_text: schema.prescriptions.corrected_text,
        ai_summary: schema.prescriptions.ai_summary,
        medicines_json: schema.prescriptions.medicines_json,
        doctor_notes: schema.prescriptions.doctor_notes,
        tags: schema.prescriptions.tags,
        important: schema.prescriptions.important,
        created_at: schema.prescriptions.created_at,
      })
      .from(schema.prescriptions)
      .leftJoin(schema.patients, eq(schema.prescriptions.patient_id, schema.patients.id))
      .where(eq(schema.prescriptions.id, id));

    if (rows.length === 0) return null;

    const r = rows[0];
    return {
      id: r.id,
      patient_id: r.patient_id,
      patient_name: r.patient_name || "Unknown Patient",
      patient_phone: r.patient_phone || "",
      image_url: r.image_url,
      raw_ocr: r.raw_ocr,
      corrected_text: r.corrected_text,
      ai_summary: r.ai_summary,
      medicines_json: (r.medicines_json as Medicine[]) || [],
      doctor_notes: r.doctor_notes,
      tags: (r.tags as string[]) || [],
      important: r.important,
      created_at: r.created_at.toISOString(),
    };
  } catch (error) {
    console.error("Neon DB error in getPrescriptionById:", error);
    return null;
  }
}

/**
 * Persist structured prescription to Neon PostgreSQL
 */
export async function createPrescription(data: {
  patient_id: string;
  image_url: string;
  raw_ocr: string;
  corrected_text: string;
  ai_summary: string;
  medicines_json: Medicine[];
  doctor_notes?: string | null;
  tags?: string[];
  important?: boolean;
}): Promise<Prescription> {
  const patient = await getPatientById(data.patient_id);

  const [inserted] = await db
    .insert(schema.prescriptions)
    .values({
      patient_id: data.patient_id,
      image_url: data.image_url,
      raw_ocr: data.raw_ocr,
      corrected_text: data.corrected_text,
      ai_summary: data.ai_summary,
      medicines_json: data.medicines_json,
      doctor_notes: data.doctor_notes || null,
      tags: data.tags || [],
      important: data.important || false,
    })
    .returning();

  return {
    id: inserted.id,
    patient_id: inserted.patient_id,
    patient_name: patient?.name || "Unknown Patient",
    patient_phone: patient?.phone || "",
    image_url: inserted.image_url,
    raw_ocr: inserted.raw_ocr,
    corrected_text: inserted.corrected_text,
    ai_summary: inserted.ai_summary,
    medicines_json: inserted.medicines_json as Medicine[],
    doctor_notes: inserted.doctor_notes,
    tags: (inserted.tags as string[]) || [],
    important: inserted.important,
    created_at: inserted.created_at.toISOString(),
  };
}

/**
 * Toggle important flag
 */
export async function togglePrescriptionImportant(id: string): Promise<boolean> {
  const current = await getPrescriptionById(id);
  if (!current) return false;
  const nextVal = !current.important;

  await db
    .update(schema.prescriptions)
    .set({ important: nextVal })
    .where(eq(schema.prescriptions.id, id));

  return nextVal;
}

/**
 * Update doctor notes
 */
export async function updatePrescriptionNotes(id: string, notes: string): Promise<boolean> {
  await db
    .update(schema.prescriptions)
    .set({ doctor_notes: notes })
    .where(eq(schema.prescriptions.id, id));

  return true;
}

/**
 * Delete prescription
 */
export async function deletePrescription(id: string): Promise<boolean> {
  await db.delete(schema.prescriptions).where(eq(schema.prescriptions.id, id));
  return true;
}

/**
 * Dashboard stats directly from Neon PostgreSQL
 */
export async function getDashboardStats() {
  const allPatients = await getPatients();
  const allPrescriptions = await getPrescriptions();

  return {
    totalPatients: allPatients.length,
    totalPrescriptions: allPrescriptions.length,
    importantPrescriptions: allPrescriptions.filter((p) => p.important).length,
    recentPrescriptions: allPrescriptions.slice(0, 5),
  };
}
