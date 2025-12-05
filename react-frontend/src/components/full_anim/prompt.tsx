"use client";

import React from "react";

interface PromptProps {
  text: string;
  isVisible: boolean;
}

export const Prompt: React.FC<PromptProps> = ({ text, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      id="prompt"
      className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 transition-all duration-500"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1)" : "scale(0.9)",
      }}
    >
      <div className="text-sm font-semibold text-blue-700 mb-2">Prompt</div>
      <div className="text-base font-mono text-gray-800">{text}</div>
    </div>
  );
};
