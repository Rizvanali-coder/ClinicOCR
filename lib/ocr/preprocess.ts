import sharp from "sharp";
import { ImageQualityReport } from "@/types";

/**
 * Smart image quality assessment before OCR
 * Evaluates blurriness, illumination, aspect ratio/resolution
 */
export async function checkImageQuality(imageBuffer: Buffer): Promise<ImageQualityReport> {
  const warnings: string[] = [];
  let isBlurry = false;
  let isLowLight = false;
  let isCroppedOrTilted = false;
  let score = 100;

  try {
    const metadata = await sharp(imageBuffer).metadata();
    const stats = await sharp(imageBuffer).grayscale().stats();

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // 1. Resolution / Crop check
    if (width < 600 || height < 600) {
      isCroppedOrTilted = true;
      score -= 30;
      warnings.push("Low image resolution. Prescription might be cropped or taken from too far.");
    }

    // 2. Lighting check via mean luminance
    const meanLuminance = stats.channels[0]?.mean || 128;
    if (meanLuminance < 65) {
      isLowLight = true;
      score -= 25;
      warnings.push("Low lighting detected. Uneven shadows may reduce OCR reading accuracy.");
    } else if (meanLuminance > 245) {
      score -= 20;
      warnings.push("High glare or overexposed lighting detected.");
    }

    // 3. Contrast / Blurriness estimation using standard deviation of luminance
    const stdDev = stats.channels[0]?.stdev || 50;
    if (stdDev < 28) {
      isBlurry = true;
      score -= 30;
      warnings.push("Image appears blurry or lacks clear text edge contrast.");
    }

    // Ensure score stays within 10-100
    score = Math.max(10, Math.min(100, Math.round(score)));

    return {
      isBlurry,
      isLowLight,
      isCroppedOrTilted,
      score,
      warnings,
    };
  } catch (err) {
    console.warn("Quality check fallback:", err);
    return {
      isBlurry: false,
      isLowLight: false,
      isCroppedOrTilted: false,
      score: 85,
      warnings: [],
    };
  }
}

/**
 * Preprocesses prescription image for optimal Tesseract OCR extraction:
 * - Auto-rotation using EXIF
 * - Resizing to optimal OCR dpi scale (~2000px max edge)
 * - Grayscale conversion
 * - Contrast normalization
 * - Text sharpening & noise reduction
 */
export async function preprocessPrescriptionImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const pipeline = sharp(imageBuffer)
      // 1. Auto rotate based on EXIF
      .rotate()
      // 2. Resize to optimal scale for text OCR without excessive memory usage
      .resize({
        width: 2200,
        height: 2200,
        fit: "inside",
        withoutEnlargement: true,
      })
      // 3. Grayscale conversion
      .grayscale()
      // 4. Contrast normalization & linear stretch
      .normalize()
      // 5. Mild sharpening to crisp handwritten strokes and printed text
      .sharpen({
        sigma: 1.2,
        m1: 1.8,
        m2: 0.5,
      })
      // 6. Convert to clean PNG for lossless OCR processing
      .png();

    return await pipeline.toBuffer();
  } catch (err) {
    console.error("Error during image preprocessing, falling back to original:", err);
    return imageBuffer;
  }
}
