"use client";

import React from "react";
import { Brain } from "lucide-react";

interface ModelProps {
  isProcessing: boolean;
  isVisible: boolean;
  modelName?: string;
}

export const Model: React.FC<ModelProps> = ({
  isProcessing,
  isVisible,
  modelName = "Language Model",
}) => {
  if (!isVisible) return null;

  return (
    <div
      id="model"
      className="p-6 rounded-lg border-2 border-green-500 bg-green-50 transition-all duration-500 flex flex-col items-center justify-center"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1)" : "scale(0.8)",
        minHeight: "120px",
      }}
    >
      <Brain
        className={`w-12 h-12 text-green-600 mb-2 ${
          isProcessing ? "animate-pulse" : ""
        }`}
      />
      <div className="text-sm font-semibold text-green-700">{modelName}</div>
      {isProcessing && (
        <div className="mt-2 text-xs text-green-600">Processing...</div>
      )}
      {!isProcessing && (
        <div className="mt-2 text-xs text-green-600">Ready</div>
      )}
    </div>
  );
};
