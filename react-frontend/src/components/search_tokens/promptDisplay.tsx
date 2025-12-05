import { TokenData } from "@/utilities/types";
import styles from "@/styles/tokens.module.css";
import { PromptToken } from "./promptToken";
import { useEffect } from "react";
import React from "react";
export interface PromptDisplayProps {
  currentTokens: TokenData[];
  onNodeClick: (selectedNodeId: string) => void;
  onContainerRender?: (containerRect: DOMRect) => void;
}
export const PromptDisplay = ({
  currentTokens,
  onNodeClick,
  onContainerRender,
}: PromptDisplayProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    // You can perform any actions with containerRef here if needed
    const container = containerRef.current;
    if (!container) return;

    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      // OR, if the last token element itself is available:
      const lastToken = container.lastElementChild;
      lastToken?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "end",
      });

      // 2. CONTAINER RENDER CALLBACK (for SVG calculations)
      const rect = container.getBoundingClientRect();
      if (onContainerRender) onContainerRender(rect);
    }, 0);

    return () => clearTimeout(timer);
  }, [currentTokens, onContainerRender]); // Changed to trigger on any token change
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
