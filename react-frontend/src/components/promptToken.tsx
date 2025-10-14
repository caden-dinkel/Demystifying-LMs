import styles from "@/styles/tokens.module.css";
import React from "react";

export interface PromptTokenProps {
  id: string; // The ID is needed for the click handler
  token: string;
  onNodeClick: (selectedNodeID: string) => void;
}

export const PromptToken = ({ id, token, onNodeClick }: PromptTokenProps) => {
  return (
    <div
      className={styles.promptToken} // This class should be width: fit-content
      onClick={() => onNodeClick(id)}
    >
      <span className={styles.promptTokenText}>{token}</span>
    </div>
  );
};
