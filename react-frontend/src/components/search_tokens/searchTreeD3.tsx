// Not utilized, just a reference for future refactoring

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { TreeNode } from "@/utilities/types"; // Your existing type

interface D3TreeProps {
  searchTree: Map<string, TreeNode>;
  searchPath: string[];
  onNodeClick: (nodeId: string) => void;
}

export const D3TokenSearchTree = ({
  searchTree,
  searchPath,
  onNodeClick,
}: D3TreeProps) => {
  const svgRef = useRef(null);

  // 1. Convert Map to D3 Hierarchical Data
  const rootNode = searchTree.get("initial");

  // A function to recursively build the D3-friendly hierarchical data
  // D3's `d3.hierarchy` needs a single root object with a `children` array.
  const buildHierarchy = (id: string): any => {
    const node = searchTree.get(id);
    if (!node) return null;

    const children = node.childrenNodeIds
      .map((childId) => buildHierarchy(childId))
      .filter((child) => child !== null);

    // Return a node structure D3 can process
    return {
      id: node.id,
      token: node.token,
      prob: node.prob,
      isSelected: node.isSelected,
      children: children.length ? children : null,
      data: node, // Storing the original TreeNode data
    };
  };

  useEffect(() => {
    if (!rootNode) return;

    // --- D3 Initialization and Render Logic ---
    const width = 1000; // Example width
    const height = 500; // Example height
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };

    // 2. Setup SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Clear previous elements
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 3. Create the D3 Hierarchy and Layout
    const hierarchyData = d3.hierarchy(buildHierarchy("initial")!);

    // Choose a tree layout (e.g., d3.tree() for a classic layout)
    const treeLayout = d3
      .tree<any>()
      .size([
        height - margin.top - margin.bottom,
        width - margin.left - margin.right,
      ]);

    const treeData = treeLayout(hierarchyData);

    // 4. Render Links (Lines connecting nodes)
    g.selectAll(".link")
      .data(treeData.links())
      .join("path")
      .attr("class", "link")
      .attr(
        "d",
        d3
          .linkHorizontal<
            d3.HierarchyPointLink<any>,
            d3.HierarchyPointNode<any>
          >()
          .x((d) => d.y) // Swap x/y for horizontal layout
          .y((d) => d.x)
      )
      .style("stroke", "#ccc")
      .style("fill", "none");

    // 5. Render Nodes (Circles, text, etc.)
    const node = g
      .selectAll(".node")
      .data(treeData.descendants())
      .join("g")
      .attr("class", (d) => `node ${d.data.isSelected ? "node--selected" : ""}`)
      .attr("transform", (d) => `translate(${d.y},${d.x})`) // Swap x/y for horizontal layout
      .on("click", (event, d) => onNodeClick(d.data.id));

    // Add a circle for the node point
    node
      .append("circle")
      .attr("r", 5)
      .style("fill", (d) => (d.data.isSelected ? "orange" : "steelblue"));

    // Add text for the token
    node
      .append("text")
      .attr("dy", 3)
      .attr("x", (d) => (d.children ? -8 : 8)) // Offset based on if it has children
      .attr("text-anchor", (d) => (d.children ? "end" : "start"))
      .text((d) => d.data.token)
      .style("font-size", "12px");
  }, [searchTree, searchPath, onNodeClick]);

  return <svg ref={svgRef}></svg>;
};
