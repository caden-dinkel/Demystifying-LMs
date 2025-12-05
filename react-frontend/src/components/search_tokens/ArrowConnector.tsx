"use client";

import React, { useCallback, useEffect, useState } from "react";
import * as d3 from "d3";

const PROMPT_ID = "search-tree-prompt";
const TOKENS_ID = "search-tree-tokens";

interface LayoutState {
  mainPath?: string;
  hubX: number;
  hubY: number;
  spokes: { index: number; path?: string }[];
}

export interface ArrowConnectorProps {
  /** Index of animating token for styling */
  animatingTokenIndex?: number | null;
}

/**
 * D3-based arrow connector that draws animated arrows between prompt and tokens.
 * Uses viewport DOM lookups (similar to arrows.tsx) instead of passed-in rects.
 */
export const ArrowConnector: React.FC<ArrowConnectorProps> = ({
  animatingTokenIndex = null,
}) => {
  const [layout, setLayout] = useState<LayoutState | null>(null);

  const computeLayout = useCallback(() => {
    const promptEl = document.getElementById(PROMPT_ID);
    const tokensContainer = document.getElementById(TOKENS_ID);

    const tokenNodes = tokensContainer
      ? Array.from(
          tokensContainer.querySelectorAll<HTMLElement>("[data-token-id]")
        )
      : Array.from(document.querySelectorAll<HTMLElement>("[data-token-id]"));

    if (!promptEl || tokenNodes.length === 0) {
      setLayout(null);
      return;
    }

    const lhsRect = promptEl.getBoundingClientRect();
    const rhsRects = tokenNodes.map((node) => node.getBoundingClientRect());

    const startX = lhsRect.right;
    const startY = lhsRect.top + lhsRect.height / 2;

    const minRhsX = Math.min(...rhsRects.map((rect) => rect.left));
    const hubX = startX + (minRhsX - startX) * 0.35;
    const hubY = startY;

    const link = d3
      .linkHorizontal<any, { x: number; y: number }>()
      .x((d) => d.x)
      .y((d) => d.y);

    const mainPath =
      link({
        source: { x: startX, y: startY },
        target: { x: hubX, y: hubY },
      }) || undefined;

    const spokes = rhsRects.map((rect, index) => ({
      index,
      path:
        link({
          source: { x: hubX, y: hubY },
          target: { x: rect.left, y: rect.top + rect.height / 2 },
        }) || undefined,
    }));

    setLayout({ mainPath, hubX, hubY, spokes });
  }, []);

  useEffect(() => {
    computeLayout();

    const handleResize = () => computeLayout();
    window.addEventListener("resize", handleResize);

    const promptEl = document.getElementById(PROMPT_ID);
    const tokensContainer = document.getElementById(TOKENS_ID);

    const resizeObserver = new ResizeObserver(() => computeLayout());
    if (promptEl) resizeObserver.observe(promptEl);
    if (tokensContainer) resizeObserver.observe(tokensContainer);

    const mutationObserver = new MutationObserver(() => computeLayout());
    if (tokensContainer) {
      mutationObserver.observe(tokensContainer, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [computeLayout, animatingTokenIndex]);

  if (!layout) return null;

  return (
    <svg
      className="pointer-events-none fixed inset-0"
      style={{ width: "100vw", height: "100vh", zIndex: 0 }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
        </marker>
      </defs>

      {layout.mainPath && (
        <path
          d={layout.mainPath}
          stroke="#94a3b8"
          strokeWidth={2}
          fill="none"
        />
      )}

      <circle
        cx={layout.hubX}
        cy={layout.hubY}
        r={6}
        fill="#cbd5e1"
        stroke="#64748b"
        strokeWidth={1}
      />

      {layout.spokes.map((spoke) =>
        spoke.path ? (
          <path
            key={spoke.index}
            d={spoke.path}
            stroke={animatingTokenIndex === spoke.index ? "#3b82f6" : "#94a3b8"}
            strokeWidth={animatingTokenIndex === spoke.index ? 3 : 2}
            fill="none"
            markerEnd="url(#arrowhead)"
            style={{
              animation:
                animatingTokenIndex === spoke.index
                  ? "dash 0.5s ease-in-out"
                  : "none",
              strokeDasharray:
                animatingTokenIndex === spoke.index ? "5,5" : undefined,
            }}
          />
        ) : null
      )}

      <style>{`
        @keyframes dash {
          from { stroke-dashoffset: 20; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
};
