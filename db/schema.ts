import { pgTable, text, integer, boolean, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { Medicine } from "@/types";

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  patient_id: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  image_url: text("image_url").notNull(),
  raw_ocr: text("raw_ocr").notNull(),
  corrected_text: text("corrected_text").notNull(),
  ai_summary: text("ai_summary").notNull(),
  medicines_json: jsonb("medicines_json").$type<Medicine[]>().notNull(),
  doctor_notes: text("doctor_notes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  important: boolean("important").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const patientsRelations = relations(patients, ({ many }) => ({
  prescriptions: many(prescriptions),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patient_id],
    references: [patients.id],
  }),
}));

export type DbPatient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;
export type DbPrescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;
