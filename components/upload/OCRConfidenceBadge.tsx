import React from "react";
import { OCRConfidenceLevel } from "@/types";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface OCRConfidenceBadgeProps {
  level: OCRConfidenceLevel;
  score: number;
  uncertainWords?: string[];
}

export function OCRConfidenceBadge({ level, score, uncertainWords = [] }: OCRConfidenceBadgeProps) {
  const config = {
    Excellent: {
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
      label: "Excellent Clarity",
    },
    Good: {
      color: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
      icon: CheckCircle2,
      label: "Good Recognition",
    },
    "Needs Review": {
      color: "bg-amber-50 text-amber-800 border-amber-300",
      dot: "bg-amber-500",
      icon: AlertCircle,
      label: "Needs Doctor Review",
    },
  }[level] || {
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    icon: HelpCircle,
    label: level,
  };

  const Icon = config.icon;

  return (
    <div className="space-y-2">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${config.color}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <Icon className="w-3.5 h-3.5" />
        <span>OCR Quality: {config.label} ({score}%)</span>
      </div>

      {uncertainWords.length > 0 && (
        <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <span className="font-semibold text-slate-700 block mb-1">
            Uncertain word tokens detected by OCR:
          </span>
          <div className="flex flex-wrap gap-1">
            {uncertainWords.map((w, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[10px] border border-amber-200"
              >
                {w}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Refined and normalized by Gemini AI in the review panel on the right.
          </span>
        </div>
      )}
    </div>
  );
}
