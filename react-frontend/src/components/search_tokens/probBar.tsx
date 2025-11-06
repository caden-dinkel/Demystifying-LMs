import React from "react";
import styles from "@/styles/tokens.module.css"; // Assuming you keep bar styles here

interface ProbBarProps {
  prob: number; // Probability from 0.0 to 1.0
}

export const ProbBar = ({ prob }: ProbBarProps) => {
  // Ensure prob is between 0 and 1
  const safeProb = Math.min(1, Math.max(0, prob));
  const fillWidth = `${safeProb * 100}%`;

  return (
    <div className={styles.probBarContainer}>
      <div className={styles.probBarFill} style={{ width: fillWidth }}></div>
    </div>
  );
};
