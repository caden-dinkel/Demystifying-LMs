"use client";

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export interface ArrowConnectorProps {
  /** Left-hand side box (typically prompt display) */
  lhsBox: DOMRect | null;
  /** Right-hand side boxes (typically tokens) */
  rhsBoxes: DOMRect[];
  /** Parent container rect for coordinate transformation */
  parentRect: DOMRect | null;
  /** Index of animating token for styling */
  animatingTokenIndex?: number | null;
}

/**
 * D3-based arrow connector that draws animated arrows between tokens
 * while keeping all structural elements as React components
 */
export const ArrowConnector: React.FC<ArrowConnectorProps> = ({
  lhsBox,
  rhsBoxes,
  parentRect,
  animatingTokenIndex = null,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!lhsBox || rhsBoxes.length === 0 || !parentRect || !svgRef.current) {
      return;
    }

    // Calculate SVG dimensions and offsets
    const offsetX = parentRect.left;
    const offsetY = parentRect.top;

    const allBoxes = [lhsBox, ...rhsBoxes];
    const relativeBoxes = allBoxes.map((box) => ({
      left: box.left - offsetX,
      right: box.right - offsetX,
      top: box.top - offsetY,
      bottom: box.bottom - offsetY,
      height: box.height,
      width: box.width,
    }));

    // Calculate bounds for SVG sizing
    const minX = Math.min(...relativeBoxes.map((box) => box.left));
    const minY = Math.min(...relativeBoxes.map((box) => box.top));
    const maxX = Math.max(...relativeBoxes.map((box) => box.right));
    const maxY = Math.max(...relativeBoxes.map((box) => box.bottom));

    const BUFFER = 20;
    const svgLeft = minX - BUFFER;
    const svgTop = minY - BUFFER;
    const svgWidth = maxX - minX + 2 * BUFFER;
    const svgHeight = maxY - minY + 2 * BUFFER;

    // Update SVG dimensions
    d3.select(svgRef.current)
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .style("left", `${svgLeft}px`)
      .style("top", `${svgTop}px`);

    // Calculate connection points in SVG coordinate space
    const startX = lhsBox.right - offsetX - svgLeft;
    const startY = lhsBox.top - offsetY + lhsBox.height / 2 - svgTop;

    const rhsRelativeBoxes = rhsBoxes.map((box) => ({
      left: box.left - offsetX - svgLeft,
      centerY: box.top - offsetY + box.height / 2 - svgTop,
    }));

    const minRhsX = Math.min(...rhsRelativeBoxes.map((box) => box.left));
    const hubX = startX + (minRhsX - startX) * 0.35;
    const hubY = startY;
    const hubRadius = 6;

    // Select and bind D3
    const svg = d3.select(svgRef.current);

    // Remove existing paths/circles
    svg.selectAll("*").remove();

    // Main path from LHS to hub
    const mainPath = svg
      .append("path")
      .attr("d", `M ${startX} ${startY} L ${hubX} ${hubY}`)
      .style("stroke", "#94a3b8")
      .style("stroke-width", 2)
      .style("fill", "none");

    // Hub circle
    svg
      .append("circle")
      .attr("cx", hubX)
      .attr("cy", hubY)
      .attr("r", hubRadius)
      .style("fill", "#cbd5e1")
      .style("stroke", "#64748b")
      .style("stroke-width", 1);

    // Arrow marker definition
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("refX", 9)
      .attr("refY", 3)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0 L0,6 L9,3 z")
      .style("fill", "#64748b");

    // Create spokes to each RHS token
    const linkGenerator = d3
      .linkHorizontal<any, { x: number; y: number }>()
      .x((d) => d.x)
      .y((d) => d.y);

    rhsRelativeBoxes.forEach((box, index) => {
      const endX = box.left;
      const endY = box.centerY;

      // Quadratic curve from hub to token
      const path = svg
        .append("path")
        .attr(
          "d",
          `M ${hubX} ${hubY} Q ${hubX} ${
            hubY + (endY - hubY) * 0.5
          }, ${endX} ${endY}`
        )
        .style("stroke", "#94a3b8")
        .style("stroke-width", 2)
        .style("fill", "none")
        .attr("marker-end", "url(#arrowhead)");

      // Apply animation styling if this token is animating
      if (animatingTokenIndex === index) {
        path
          .style("stroke", "#3b82f6")
          .style("stroke-width", 3)
          .style("animation", "dash 0.5s ease-in-out");
      }
    });

    // Add dash animation style
    if (!svg.select("style").empty()) {
      svg.select("style").remove();
    }

    svg.append("style").text(`
        @keyframes dash {
          from {
            stroke-dashoffset: 20;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `);
  }, [lhsBox, rhsBoxes, parentRect, animatingTokenIndex]);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        position: "absolute",
        zIndex: 0,
      }}
    />
  );
};
