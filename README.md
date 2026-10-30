# ClinicOCR &bull; AI Medical Document Intelligence Platform

**ClinicOCR** is a specialized, lightweight AI-powered SaaS platform that converts handwritten doctor prescriptions into structured, searchable digital medical records using **Tesseract OCR** and **Google Gemini AI**.

It is tailored for small clinics, private doctors, and medical practitioners to reduce manual transcription effort while guaranteeing complete doctor review authority before any medical record is saved.

---

## 🏥 Architecture & Dual-Stage Pipeline

```
Doctor / Clinic Staff
        │
        ▼
Upload Prescription Image (JPG, JPEG, PNG, Drag & Drop, or Clinic Samples)
        │
        ▼
Image Preprocessing (Sharp: Auto-rotate EXIF, contrast normalization, sharpening, noise reduction)
        │
        ▼
Stage 1: Tesseract OCR (Extracts raw character matrix, computes confidence score & uncertain words)
        │
        ▼
Raw OCR Output (Preserved unmodified for doctor reference & audit)
        │
        ▼
Stage 2: Google Gemini Flash (Corrects medical OCR typos, structures medicines with dosage/frequency, generates clinical summary & tags)
        │
        ▼
Interactive Doctor Review Workspace (Doctor edits text, medicines, notes, and assigns ⭐ Important)
        │
        ▼
Save to Neon PostgreSQL (Drizzle ORM)
        │
        ▼
Searchable Patient History & PDF Report Export
```

---

## 🚀 Key Features

### Phase 1 (MVP)
- **Clinic Overview Dashboard:** Real-time statistics on total patients, prescriptions, and recent uploads with one-click actions.
- **Patient Management:** Add, edit, delete, and search clinic patients (Name, Age, Gender, Phone Number).
- **Prescription Upload & Analysis:** Seamless upload of prescription photos with pre-loaded medical samples for instant testing.
- **Raw OCR Preservation:** Doctors can view the unmodified raw OCR output at all times.
- **Gemini Flash Medical Intelligence:** Automatically corrects OCR typos and structures medicines into standardized dosages and intake frequencies.
- **Doctor Verification Authority:** Nothing is saved automatically. The doctor has full control to edit every field before persisting.
- **Patient History:** Complete digital prescription records linked to each patient.

### Phase 2 Enhancements
- **Smart Image Quality Check:** Pre-OCR analysis warning if images are blurry, have low lighting, or are poorly cropped.
- **OCR Confidence Indicator:** Displays OCR quality as *Excellent*, *Good*, or *Needs Review*, highlighting uncertain word tokens.
- **Smart Medicine Recognition:** Displays medicine names as status badges, automatically flagging uncertain items as `Possibly [Name]`.
- **Search System:** Search records across patient names, phone numbers, medicine names, or clinical tags.
- **Prescription Organization Tags:** AI automatically generates clinical tags (e.g. *Fever*, *Cold*, *Antibiotic*, *Pediatric*, *Pain Relief*).
- **Doctor Notes:** Attending doctors can add personalized notes and follow-up directives.
- **Important Records:** Mark critical prescriptions as ⭐ Important to pin them to the top of patient history.
- **Download Report (PDF Export):** Export clinical reports containing corrected text, AI summary, medicine table, and doctor notes formatted for printing or sharing.

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React, Sonner
- **Backend:** Next.js Route Handlers & Server Actions
- **Database:** Neon PostgreSQL with Drizzle ORM (with seamless offline fallback for local development)
- **OCR Engine:** Tesseract OCR (`tesseract.js`)
- **Image Preprocessing:** Sharp (lossless contrast stretch, auto-rotation, sharpening)
- **AI Engine:** Google Gemini Flash via official `@google/genai` SDK
- **PDF Generation:** jsPDF

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Neon PostgreSQL Database URL
DATABASE_URL=postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/clinicocr?sslmode=require

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note:** If `DATABASE_URL` is omitted, ClinicOCR automatically runs using resilient clinic mock memory persistence, allowing full testing of all workflows immediately. If `GEMINI_API_KEY` is omitted, an intelligent clinical heuristic parser runs as a fallback.

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Database Push (Optional for Neon DB)
```bash
npm run db:push
```

### 4. Build for Production
```bash
npm run build
npm run start
```
