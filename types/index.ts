export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  created_at: string | Date;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_phone?: string;
  image_url: string;
  raw_ocr: string;
  corrected_text: string;
  ai_summary: string;
  medicines_json: Medicine[];
  doctor_notes?: string | null;
  tags?: string[];
  important: boolean;
  created_at: string | Date;
}

export interface ImageQualityReport {
  isBlurry: boolean;
  isLowLight: boolean;
  isCroppedOrTilted: boolean;
  score: number;
  warnings: string[];
}

export type OCRConfidenceLevel = 'Excellent' | 'Good' | 'Needs Review';

export interface OCRResult {
  text: string;
  confidence: number;
  confidenceLevel: OCRConfidenceLevel;
  uncertainWords: string[];
}

export interface GeminiAnalysisResult {
  corrected_text: string;
  summary: string;
  medicines: Medicine[];
  important_findings: string[];
  tags: string[];
}

export interface OCRPipelineResult {
  raw_ocr: string;
  confidence: OCRConfidenceLevel;
  confidenceScore: number;
  uncertainWords: string[];
  quality: ImageQualityReport;
  aiAnalysis: GeminiAnalysisResult;
}
