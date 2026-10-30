import { createWorker } from "tesseract.js";
import { OCRConfidenceLevel, OCRResult } from "@/types";

/**
 * Executes Tesseract OCR on the preprocessed prescription image.
 * Preserves raw output strictly without modification.
 * Calculates confidence scores and extracts uncertain words.
 */
export async function runTesseractOCR(imageBuffer: Buffer): Promise<OCRResult> {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    worker = await createWorker("eng");
    
    // Configure worker parameters for medical text / prescription reading
    await worker.setParameters({
      tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,:;/-+%()[]{} \n\r#@&",
    });

    const ret = await worker.recognize(imageBuffer);
    const text = ret.data.text?.trim() || "";
    const overallConfidence = ret.data.confidence ?? 0;

    // Detect uncertain words (confidence < 60 or symbols)
    const uncertainWords: string[] = [];
    if (ret.data.words && Array.isArray(ret.data.words)) {
      for (const word of ret.data.words) {
        const cleaned = word.text?.replace(/[^a-zA-Z0-9]/g, "");
        if (cleaned && cleaned.length > 2 && word.confidence < 60) {
          if (!uncertainWords.includes(word.text)) {
            uncertainWords.push(word.text);
          }
        }
      }
    }

    let confidenceLevel: OCRConfidenceLevel = "Needs Review";
    if (overallConfidence >= 75) {
      confidenceLevel = "Excellent";
    } else if (overallConfidence >= 50) {
      confidenceLevel = "Good";
    }

    return {
      text: text || "No text could be extracted by OCR from the image.",
      confidence: Math.round(overallConfidence),
      confidenceLevel,
      uncertainWords: uncertainWords.slice(0, 15),
    };
  } catch (error) {
    console.error("Tesseract OCR execution error:", error);
    // Graceful fallback if Tesseract worker throws
    return {
      text: "Unable to process OCR on this image. Please ensure the prescription is clearly legible.",
      confidence: 0,
      confidenceLevel: "Needs Review",
      uncertainWords: [],
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (err) {
        // ignore cleanup error
      }
    }
  }
}
