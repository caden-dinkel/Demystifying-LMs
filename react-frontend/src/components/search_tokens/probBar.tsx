import React from "react";

interface ProbBarProps {
  prob: number; // Probability from 0.0 to 1.0
}

export const ProbBar = ({ prob }: ProbBarProps) => {
  // Ensure prob is between 0 and 1
  const safeProb = Math.min(1, Math.max(0, prob));
  const fillWidth = `${safeProb * 100}%`;

  return (
    <div className="w-full h-1.5 bg-border rounded-sm overflow-hidden">
      <div
        className="h-full bg-primary transition-all duration-300 ease-in-out"
        style={{ width: fillWidth }}
      />
    </div>
  );
};
