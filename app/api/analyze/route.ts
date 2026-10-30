import { NextRequest, NextResponse } from "next/server";
import { processPrescriptionPipeline } from "@/lib/ocr/pipeline";
import { checkImageQuality } from "@/lib/ocr/preprocess";

export const maxDuration = 60; // Allow sufficient time for OCR + Gemini inference

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const checkOnly = formData.get("checkOnly") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If client only asked for instant pre-upload quality check (Phase 2)
    if (checkOnly) {
      const quality = await checkImageQuality(buffer);
      return NextResponse.json({ success: true, quality });
    }

    // Convert file to base64 data URL for preview and storage
    const mimeType = file.type || "image/jpeg";
    const base64Data = buffer.toString("base64");
    const imageUrl = `data:${mimeType};base64,${base64Data}`;

    // Execute full pipeline
    const result = await processPrescriptionPipeline(buffer);

    return NextResponse.json({
      success: true,
      imageUrl,
      ...result,
    });
  } catch (error: any) {
    console.error("Prescription analysis API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process prescription image" },
      { status: 500 }
    );
  }
}
