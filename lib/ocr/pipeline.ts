import { checkImageQuality, preprocessPrescriptionImage } from "./preprocess";
import { runTesseractOCR } from "./tesseract";
import { analyzePrescriptionWithGemini } from "./gemini";
import { OCRPipelineResult } from "@/types";

/**
 * End-to-end Medical OCR Pipeline:
 * Image -> Quality Check -> Preprocessing -> Tesseract OCR -> Gemini AI Structuring
 */
export async function processPrescriptionPipeline(imageBuffer: Buffer): Promise<OCRPipelineResult> {
  // Step 1: Smart Image Quality Check
  const quality = await checkImageQuality(imageBuffer);

  // Step 2: Image Preprocessing for optimal text edge recognition
  const preprocessedBuffer = await preprocessPrescriptionImage(imageBuffer);

  // Step 3: Tesseract OCR execution
  const ocrResult = await runTesseractOCR(preprocessedBuffer);

  // Step 4: Google Gemini Flash AI processing
  // Gemini receives raw OCR output and performs error correction & clinical structuring
  const aiAnalysis = await analyzePrescriptionWithGemini(ocrResult.text);

  return {
    raw_ocr: ocrResult.text,
    confidence: ocrResult.confidenceLevel,
    confidenceScore: ocrResult.confidence,
    uncertainWords: ocrResult.uncertainWords,
    quality,
    aiAnalysis,
  };
}
