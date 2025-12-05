"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface SamplingProps {
  selectedToken: string | null;
  isVisible: boolean;
  method?: "greedy" | "sampling" | "beam";
}

export const Sampling: React.FC<SamplingProps> = ({
  selectedToken,
  isVisible,
  method = "greedy",
}) => {
  if (!isVisible) return null;

  const methodDescriptions = {
    greedy: "Highest Probability",
    sampling: "Probabilistic Selection",
    beam: "Multiple Paths",
  };

  return (
    <div
      id="sampling"
      className="p-4 rounded-lg border-2 border-pink-500 bg-pink-50 transition-all duration-500"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1)" : "scale(0.9)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-pink-600" />
        <div className="text-sm font-semibold text-pink-700">
          Sampling Strategy
        </div>
      </div>
      <div className="text-xs text-pink-600 mb-2">
        {methodDescriptions[method]}
      </div>
      {selectedToken && (
        <div className="mt-3 p-3 bg-pink-200 rounded-lg border border-pink-300">
          <div className="text-xs text-pink-700 mb-1">Selected Token:</div>
          <div className="text-lg font-mono font-bold text-pink-900">
            {selectedToken.replace(/\u0120/g, " ")}
          </div>
        </div>
      )}
      {!selectedToken && (
        <div className="mt-3 p-3 bg-pink-100 rounded-lg border border-pink-200 text-center">
          <div className="text-xs text-pink-600 italic">
            Waiting for selection...
          </div>
        </div>
      )}
    </div>
  );
};
