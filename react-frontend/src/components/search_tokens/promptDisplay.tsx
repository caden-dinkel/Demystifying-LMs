import { TokenData } from "@/utilities/types";
import styles from "@/styles/tokens.module.css";
import { PromptToken } from "./promptToken";
import { useEffect, useCallback, useRef } from "react";
import React from "react";

export interface PromptDisplayProps {
  currentTokens: TokenData[];
  onNodeClick: (selectedNodeId: string) => void;
}

/**
 * PromptDisplay - React component that displays the current prompt as token chips
 * Uses callback to notify parent of DOM rect for arrow rendering
 */
export const PromptDisplay: React.FC<PromptDisplayProps> = ({
  currentTokens,
  onNodeClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the last token
    const lastToken = containerRef.current?.lastElementChild;
    lastToken?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "end",
    });
  }, [currentTokens]);

  return (
    <div className={styles.promptDisplayWrapper}>
      <label className={styles.promptDisplayLabel}>Current Prompt</label>
      <div
        id="search-tree-prompt"
        className={styles.promptDisplayContainer}
        ref={containerRef}
      >
        {currentTokens.map((tokenData) => (
          <PromptToken
            key={tokenData.id}
            id={tokenData.id}
            token={tokenData.token}
            onNodeClick={onNodeClick}
          />
        ))}
      </div>
    </div>
  );
};
