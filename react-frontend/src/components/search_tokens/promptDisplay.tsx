import { TokenData } from "@/utilities/types";
import styles from "@/styles/tokens.module.css";
import { PromptToken } from "./promptToken";
import { useEffect, useCallback, useRef } from "react";
import React from "react";

export interface PromptDisplayProps {
  currentTokens: TokenData[];
  onNodeClick: (selectedNodeId: string) => void;
  onContainerRender?: (containerRect: DOMRect) => void;
}

/**
 * PromptDisplay - React component that displays the current prompt as token chips
 * Uses callback to notify parent of DOM rect for arrow rendering
 */
export const PromptDisplay: React.FC<PromptDisplayProps> = ({
  currentTokens,
  onNodeClick,
  onContainerRender,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Update callback - memoized to avoid unnecessary updates
  const notifyContainerRender = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (onContainerRender) onContainerRender(rect);
  }, [onContainerRender]);

  useEffect(() => {
    // Scroll to the last token
    const lastToken = containerRef.current?.lastElementChild;
    lastToken?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "end",
    });

    // Notify parent of container dimensions
    notifyContainerRender();
  }, [currentTokens, notifyContainerRender]);

  // Also update on window resize
  useEffect(() => {
    const handleResize = () => {
      notifyContainerRender();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [notifyContainerRender]);

  return (
    <div className={styles.promptDisplayWrapper}>
      <label className={styles.promptDisplayLabel}>Current Prompt</label>
      <div className={styles.promptDisplayContainer} ref={containerRef}>
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
