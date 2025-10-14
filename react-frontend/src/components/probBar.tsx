import React from "react";
import button from "@/styles/tokens.module.css"; // Assuming you keep bar styles here

interface ProbBarProps {
  prob: number; // Probability from 0.0 to 1.0
}

export const ProbBar = ({ prob }: ProbBarProps) => {
  const fillWidth = `${prob * 100}%`;

  return (
    <div className={button.probBarContainer}>
      <div className={button.probBarFill} style={{ width: fillWidth }}></div>
    </div>
  );
};
