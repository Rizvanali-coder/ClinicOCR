import React from "react";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { ImageQualityReport } from "@/types";

interface ImageQualityAlertProps {
  quality: ImageQualityReport;
}

export function ImageQualityAlert({ quality }: ImageQualityAlertProps) {
  const hasWarnings = quality.warnings && quality.warnings.length > 0;

  if (!hasWarnings && quality.score >= 80) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <div className="flex-1">
          <span className="font-semibold">Optimal Image Quality ({quality.score}/100)</span>
          <span className="text-emerald-700 ml-1.5">
            Clear contrast and lighting detected for accurate OCR processing.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-900 text-xs space-y-1.5 animate-in fade-in">
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Pre-OCR Quality Notice (Score: {quality.score}/100)</span>
      </div>
      <ul className="list-disc pl-5 space-y-0.5 text-amber-800">
        {quality.warnings.map((w, idx) => (
          <li key={idx}>{w}</li>
        ))}
      </ul>
      <p className="text-[11px] text-amber-700 pt-0.5 italic">
        Tip: You may continue or upload a clearer, well-lit photo for higher OCR accuracy.
      </p>
    </div>
  );
}
