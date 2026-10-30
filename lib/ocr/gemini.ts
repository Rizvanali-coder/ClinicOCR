import { GoogleGenAI, Type } from "@google/genai";
import { GeminiAnalysisResult, Medicine } from "@/types";

const SYSTEM_PROMPT = `You are ClinicOCR's specialized medical document intelligence AI assistant.
Your task is to analyze raw OCR text extracted from a handwritten or printed medical prescription.

Strict Rules:
1. Never hallucinate missing information. Only extract what is supported by the text.
2. Correct common OCR character mistakes (e.g., '1' vs 'l', '0' vs 'O', 'Tab' instead of 'Tah', etc.).
3. Preserve uncertain text or abbreviations if the doctor wrote them.
4. If a medicine name is unclear or ambiguous from the OCR, prefix the medicine name with "Possibly " (e.g. "Possibly Levolin").
5. Structure medicines into name, dosage (e.g. 500mg, 10ml), and frequency (e.g. 1-0-1, OD, BD, TDS, Twice daily after food).
6. Provide a concise, clear clinical summary of the prescription.
7. Extract clinical notes or important findings (e.g., BP 130/85, High fever x 3 days, allergic to penicillin).
8. Generate 2 to 5 relevant clinical tags (e.g. Fever, Antibiotic, Pediatric, Pain Relief, Hypertension, ENT).
9. Output must strictly conform to the JSON schema.`;

/**
 * Intelligent fallback parser in case Gemini API Key is missing or rate limited
 */
function fallbackParsing(rawOcr: string): GeminiAnalysisResult {
  const lines = rawOcr
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const medicines: Medicine[] = [];
  const tags: string[] = ["General Consultation"];
  const important_findings: string[] = [];

  const commonDosageRegex = /(\d+\s*(?:mg|ml|g|mcg|tablets?|caps?)|OD|BD|TDS|QDS|once|twice|thrice)/i;
  const commonMeds = [
    "paracetamol", "amoxicillin", "azithromycin", "pantoprazole", "cetirizine", 
    "ibuprofen", "metformin", "atorvastatin", "omeprazole", "levolin", "augmentin"
  ];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const matchedMed = commonMeds.find((m) => lower.includes(m));
    if (matchedMed || /^(tab|cap|syp|inj)\b/i.test(line)) {
      const dosageMatch = line.match(/(\d+\s*(?:mg|ml|g))/i);
      const freqMatch = line.match(/(OD|BD|TDS|1-0-1|1-1-1|1-0-0|0-0-1|twice|thrice|daily)/i);
      
      medicines.push({
        name: line.split(/[-–:]/)[0].trim(),
        dosage: dosageMatch ? dosageMatch[0] : "As directed",
        frequency: freqMatch ? freqMatch[0] : "1-0-1 (After food)",
      });
    }

    if (/bp|pulse|temp|fever|cough|allergy|weight/i.test(line)) {
      important_findings.push(line);
    }
  }

  if (medicines.length === 0 && lines.length > 0) {
    medicines.push({
      name: lines[0],
      dosage: "As directed",
      frequency: "Daily",
    });
  }

  if (rawOcr.toLowerCase().includes("fever")) tags.push("Fever");
  if (rawOcr.toLowerCase().includes("cough") || rawOcr.toLowerCase().includes("cold")) tags.push("Cold");
  if (rawOcr.toLowerCase().includes("pain")) tags.push("Pain Relief");

  return {
    corrected_text: lines.join("\n"),
    summary: lines.length > 0 ? `Prescription with ${medicines.length} medication(s) prescribed.` : "No medical details detected.",
    medicines,
    important_findings: important_findings.length > 0 ? important_findings : ["Standard follow-up recommended"],
    tags: Array.from(new Set(tags)),
  };
}

/**
 * Sends Raw OCR text to Google Gemini (gemini-3.8-flash) for medical correction and structuring.
 */
export async function analyzePrescriptionWithGemini(rawOcr: string): Promise<GeminiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    console.warn("GEMINI_API_KEY is not configured. Utilizing intelligent heuristic clinical parser.");
    return fallbackParsing(rawOcr);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
    });

    const userPrompt = `Here is the raw OCR text extracted from a handwritten prescription:\n\n"""\n${rawOcr}\n"""\n\nPlease clean OCR typos, extract medicines with dosage and frequency, produce a summary, important findings, and organization tags.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            corrected_text: {
              type: Type.STRING,
              description: "Cleaned and logically formatted full prescription text.",
            },
            summary: {
              type: Type.STRING,
              description: "Concise clinical summary of diagnosis, symptoms, and treatment plan.",
            },
            medicines: {
              type: Type.ARRAY,
              description: "List of extracted medicines.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: "Medicine name. If handwriting is uncertain, prefix with 'Possibly '.",
                  },
                  dosage: {
                    type: Type.STRING,
                    description: "Dosage strength or amount.",
                  },
                  frequency: {
                    type: Type.STRING,
                    description: "Schedule/frequency of intake.",
                  },
                },
                required: ["name", "dosage", "frequency"],
              },
            },
            important_findings: {
              type: Type.ARRAY,
              description: "Vitals, allergies, lab recommendations, or special instructions.",
              items: { type: Type.STRING },
            },
            tags: {
              type: Type.ARRAY,
              description: "2 to 5 short clinical tags (e.g. Fever, Antibiotic, Pediatric, Pain Relief).",
              items: { type: Type.STRING },
            },
          },
          required: ["corrected_text", "summary", "medicines", "important_findings", "tags"],
        },
      },
    });

    const text = response.text?.trim() || "";
    if (!text) {
      throw new Error("Empty response returned by Gemini model");
    }

    const parsed = JSON.parse(text) as GeminiAnalysisResult;
    return parsed;
  } catch (error) {
    console.error("Gemini API processing failed, falling back to heuristic parser:", error);
    return fallbackParsing(rawOcr);
  }
}
