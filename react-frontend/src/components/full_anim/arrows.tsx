"use client";

import React, { useRef, useState, useEffect } from "react";
import * as d3 from "d3";

interface ArrowsProps {
  step: number;
}

export const Arrows: React.FC<ArrowsProps> = ({ step }) => {
  const containerRef = useRef<SVGSVGElement>(null);
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    const updatePaths = () => {
      const promptBox = document
        .getElementById("prompt")
        ?.getBoundingClientRect();
      const tokensBox = document
        .getElementById("tokens")
        ?.getBoundingClientRect();
      const modelBox = document
        .getElementById("model")
        ?.getBoundingClientRect();
      const logitsBox = document
        .getElementById("logits")
        ?.getBoundingClientRect();
      const samplingBox = document
        .getElementById("sampling")
        ?.getBoundingClientRect();

      if (!promptBox) return;

      const newPaths: string[] = [];

      // Step 1: Prompt -> Tokens
      if (step >= 1 && tokensBox) {
        const path = d3
          .linkHorizontal<any, { x: number; y: number }>()
          .x((d) => d.x)
          .y((d) => d.y)({
          source: {
            x: promptBox.right,
            y: promptBox.top + promptBox.height / 2,
          },
          target: {
            x: tokensBox.left,
            y: tokensBox.top + tokensBox.height / 2,
          },
        });
        if (path) newPaths.push(path);
      }

      // Step 2: Tokens -> Model
      if (step >= 2 && tokensBox && modelBox) {
        const path = d3
          .linkHorizontal<any, { x: number; y: number }>()
          .x((d) => d.x)
          .y((d) => d.y)({
          source: {
            x: tokensBox.right,
            y: tokensBox.top + tokensBox.height / 2,
          },
          target: {
            x: modelBox.left,
            y: modelBox.top + modelBox.height / 2,
          },
        });
        if (path) newPaths.push(path);
      }

      // Step 3: Model -> Logits
      if (step >= 3 && modelBox && logitsBox) {
        const path = d3
          .linkHorizontal<any, { x: number; y: number }>()
          .x((d) => d.x)
          .y((d) => d.y)({
          source: {
            x: modelBox.right,
            y: modelBox.top + modelBox.height / 2,
          },
          target: {
            x: logitsBox.left,
            y: logitsBox.top + logitsBox.height / 2,
          },
        });
        if (path) newPaths.push(path);
      }

      // Step 4: Logits -> Sampling
      if (step >= 4 && logitsBox && samplingBox) {
        const path = d3
          .linkHorizontal<any, { x: number; y: number }>()
          .x((d) => d.x)
          .y((d) => d.y)({
          source: {
            x: logitsBox.right,
            y: logitsBox.top + logitsBox.height / 2,
          },
          target: {
            x: samplingBox.left,
            y: samplingBox.top + samplingBox.height / 2,
          },
        });
        if (path) newPaths.push(path);
      }

      setPaths(newPaths);
    };

    // Update on mount and when step changes
    updatePaths();

    // Update on resize
    window.addEventListener("resize", updatePaths);

    // Small delay to ensure DOM has updated
    const timer = setTimeout(updatePaths, 100);

    return () => {
      window.removeEventListener("resize", updatePaths);
      clearTimeout(timer);
    };
  }, [step]);

  return (
    <svg
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%", zIndex: 0 }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
        </marker>
      </defs>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="#94a3b8"
          strokeWidth={2}
          fill="none"
          markerEnd="url(#arrowhead)"
          style={{
            animation: "dash 0.5s ease-in-out",
            strokeDasharray: "5,5",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes dash {
          from {
            stroke-dashoffset: 20;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </svg>
  );
};
