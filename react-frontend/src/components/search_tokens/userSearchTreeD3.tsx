"use client";
import React, { useRef, useEffect, useCallback, useState } from "react";
import * as d3 from "d3";
import { getTokenProbabilities } from "@/api/getTokenProbs";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import { SearchTreeProvider, useSearchTree } from "./useSearchTree";
import styles from "../../styles/search-tree.module.css";

export interface UserSearchTreeD3Props {
  initialPrompt: string;
}

interface D3Node {
  id: string;
  token: string;
  prob: number;
  x: number;
  y: number;
  children?: D3Node[];
  parent?: D3Node;
  isSelected?: boolean;
}

const UserSearchTreeD3Content = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomTransformRef = useRef<d3.ZoomTransform | null>(null);
  const { selectedLM } = useLMSettings();
  const {
    searchTree,
    searchPath,
    addChildrenToNode,
    selectNode,
    deselectNode,
    moveToNode,
    navigateBack,
    buildPromptFromPath,
    getNodeById,
  } = useSearchTree();

  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [textBoxPosition, setTextBoxPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Convert searchTree Map to D3 hierarchy - show path and all siblings
  const buildD3Tree = useCallback((): D3Node | null => {
    if (searchPath.length === 0) return null;

    // Get the current node (last in path)
    const currentNodeId = searchPath[searchPath.length - 1];
    const currentNode = searchTree.get(currentNodeId);
    if (!currentNode) return null;

    // Build the selected path nodes + all siblings along the path + children of current node
    const buildNode = (nodeId: string, depth: number): D3Node | null => {
      const node = searchTree.get(nodeId);
      if (!node) return null;

      const d3Node: D3Node = {
        id: node.id,
        token: node.token,
        prob: node.prob,
        x: 0,
        y: 0,
        isSelected: node.isSelected,
      };

      // Check if this node is in the path or is the current node
      const isInPath = searchPath.includes(nodeId);
      const isCurrentNode = nodeId === currentNodeId;

      if (isCurrentNode && node.childrenNodeIds.length > 0) {
        // Show all children of current node
        d3Node.children = node.childrenNodeIds
          .map((childId) => buildNode(childId, depth + 1))
          .filter((n): n is D3Node => n !== null);
      } else if (
        isInPath &&
        depth < searchPath.length - 1 &&
        node.childrenNodeIds.length > 0
      ) {
        // For path nodes, show ALL children (including unchosen siblings)
        d3Node.children = node.childrenNodeIds
          .map((childId) => buildNode(childId, depth + 1))
          .filter((n): n is D3Node => n !== null);
      }

      return d3Node;
    };

    return buildNode(searchPath[0], 0);
  }, [searchTree, searchPath]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement;
        if (container) {
          setDimensions({
            width: container.clientWidth,
            height: Math.max(600, container.clientHeight),
          });
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle token selection and API call
  const handleTokenClick = useCallback(
    async (nodeId: string) => {
      const node = getNodeById(nodeId);
      if (!node) return;

      setSelectedTokenId(nodeId);

      // If node is already in the path, navigate back to it
      if (searchPath.includes(nodeId)) {
        navigateBack(nodeId);
        setSelectedTokenId(null);
        return;
      }

      // If node already has children, just navigate forward
      if (node.childrenNodeIds.length > 0) {
        const currentPathEndId = searchPath[searchPath.length - 1];
        deselectNode(currentPathEndId);
        selectNode(nodeId);
        moveToNode(nodeId);
        setSelectedTokenId(null);
        return;
      }

      // Build prompt and fetch new tokens
      const promptForApi = buildPromptFromPath() + node.token;

      try {
        const data = await getTokenProbabilities(promptForApi, selectedLM);
        const currentPathEndId = searchPath[searchPath.length - 1];

        deselectNode(currentPathEndId);
        selectNode(nodeId);
        addChildrenToNode(
          nodeId,
          data.tokens,
          data.probabilities,
          data.token_ids
        );
        moveToNode(nodeId);
      } catch (error) {
        console.error("Error fetching tokens:", error);
      } finally {
        setSelectedTokenId(null);
      }
    },
    [
      searchPath,
      selectedLM,
      getNodeById,
      buildPromptFromPath,
      deselectNode,
      selectNode,
      addChildrenToNode,
      moveToNode,
      navigateBack,
    ]
  );

  // Handle clicking on prompt tokens to navigate back
  const handlePromptTokenClick = useCallback(
    (nodeId: string) => {
      navigateBack(nodeId);
    },
    [navigateBack]
  );

  // Render D3 tree
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const rootData = buildD3Tree();
    if (!rootData) return;

    const margin = { top: 60, right: 120, bottom: 40, left: 120 };
    const width = Math.max(dimensions.width - margin.left - margin.right, 1200);
    const height = Math.max(
      dimensions.height - margin.top - margin.bottom,
      800
    );

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        zoomTransformRef.current = event.transform;
        g.attr("transform", event.transform);
      });

    // Apply zoom to SVG
    svg.call(zoom as any);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Restore previous zoom transform if it exists
    if (zoomTransformRef.current) {
      svg.call(zoom.transform as any, zoomTransformRef.current);
    }

    // Create tree layout with minimum node spacing
    // nodeSize ensures minimum spacing: [vertical, horizontal]
    const minVerticalSpacing = 50; // Minimum vertical spacing between nodes (reduced from 80)
    const minHorizontalSpacing = 150; // Minimum horizontal spacing between levels
    const treeLayout = d3
      .tree<D3Node>()
      .nodeSize([minVerticalSpacing, minHorizontalSpacing]);

    const root = d3.hierarchy(rootData);
    treeLayout(root);

    // Center RHS children vertically around their parent LHS token
    root.descendants().forEach((d) => {
      if (d.children && d.children.length > 0) {
        // Calculate the vertical center of all children
        const childXValues = d.children.map((child) => child.x || 0);
        const minChildX = Math.min(...childXValues);
        const maxChildX = Math.max(...childXValues);
        const childrenCenter = (minChildX + maxChildX) / 2;

        // Calculate offset needed to center children around parent
        const parentX = d.x || 0;
        const offset = parentX - childrenCenter;

        // Apply offset to all children
        d.children.forEach((child) => {
          if (child.x !== undefined) {
            child.x += offset;
          }
        });
      }
    });

    // Calculate actual dimensions needed and center the tree
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    root.descendants().forEach((d) => {
      if (d.x !== undefined) {
        minX = Math.min(minX, d.x);
        maxX = Math.max(maxX, d.x);
      }
      if (d.y !== undefined) {
        minY = Math.min(minY, d.y);
        maxY = Math.max(maxY, d.y);
      }
    });

    // Center the tree vertically
    const verticalOffset = -minX + 100;
    root.descendants().forEach((d) => {
      if (d.x !== undefined) {
        d.x += verticalOffset;
      }
    });

    const actualHeight = Math.max(maxX - minX + 200, height);
    const actualWidth = Math.max(maxY - minY + 400, width);

    // Update SVG size if needed
    svg.attr("width", actualWidth + margin.left + margin.right);
    svg.attr("height", actualHeight + margin.top + margin.bottom);

    // Draw links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", (d) => (d.target.data.isSelected ? "#3b82f6" : "#94a3b8"))
      .attr("stroke-width", (d) => (d.target.data.isSelected ? 3 : 2))
      .attr(
        "d",
        d3
          .linkHorizontal<any, any>()
          .x((d) => d.y)
          .y((d) => d.x)
      );

    // Draw nodes
    const nodes = g
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .style("cursor", "pointer");

    // Add background rect for better token display
    nodes
      .append("rect")
      .attr("x", -45)
      .attr("y", -18)
      .attr("width", 90)
      .attr("height", 36)
      .attr("rx", 6)
      .attr("fill", (d) => {
        if (d.data.isSelected) return "#dbeafe";
        if (searchPath.includes(d.data.id)) return "#e0f2fe";
        return "#f8fafc";
      })
      .attr("stroke", (d) => {
        if (selectedTokenId === d.data.id) return "#f59e0b";
        if (d.data.isSelected) return "#3b82f6";
        if (searchPath.includes(d.data.id)) return "#60a5fa";
        return "#cbd5e1";
      })
      .attr("stroke-width", (d) => (selectedTokenId === d.data.id ? 3 : 2))
      .on("click", (event, d) => {
        event.stopPropagation();
        handleTokenClick(d.data.id);
      });

    // Add token text
    nodes
      .append("text")
      .attr("dy", -3)
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .attr("font-weight", (d) => (d.data.isSelected ? "600" : "500"))
      .attr("fill", "#1e293b")
      .text((d) => d.data.token)
      .style("pointer-events", "none");

    // Add probability text
    nodes
      .append("text")
      .attr("dy", 11)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("fill", "#64748b")
      .text((d) => `${(d.data.prob * 100).toFixed(1)}%`)
      .style("pointer-events", "none");

    // Add probability bar below each node
    const barWidth = 80;
    const barHeight = 4;
    const barY = 22; // Position below the node

    nodes
      .append("rect")
      .attr("x", -barWidth / 2)
      .attr("y", barY)
      .attr("width", barWidth)
      .attr("height", barHeight)
      .attr("rx", 2)
      .attr("fill", "#e5e7eb");

    nodes
      .append("rect")
      .attr("x", -barWidth / 2)
      .attr("y", barY)
      .attr("width", (d) => d.data.prob * barWidth)
      .attr("height", barHeight)
      .attr("rx", 2)
      .attr("fill", (d) => {
        if (selectedTokenId === d.data.id) return "#f59e0b";
        if (d.data.isSelected) return "#3b82f6";
        return "#60a5fa";
      });

    // Draw prompt path at the top
    const promptTokens = searchPath
      .map((id) => searchTree.get(id))
      .filter((node) => node !== undefined);

    const promptGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 20)`);

    promptGroup
      .selectAll(".prompt-token")
      .data(promptTokens)
      .enter()
      .append("g")
      .attr("class", "prompt-token")
      .attr("transform", (d, i) => `translate(${i * 80}, 0)`)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        handlePromptTokenClick(d.id);
      })
      .each(function (d) {
        const g = d3.select(this);

        // Background rect
        g.append("rect")
          .attr("x", -35)
          .attr("y", -12)
          .attr("width", 70)
          .attr("height", 24)
          .attr("rx", 4)
          .attr("fill", d.isSelected ? "#dbeafe" : "#f1f5f9")
          .attr("stroke", "#94a3b8")
          .attr("stroke-width", 1);

        // Token text
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "11px")
          .attr("fill", "#1e293b")
          .text(d.token);
      });

    // Center viewport on RHS tokens if we just expanded
    if (searchPath.length > 0) {
      const currentNodeId = searchPath[searchPath.length - 1];
      const descendants = root.descendants();
      const currentNode = descendants.find(
        (d: any) => d.data.id === currentNodeId
      );

      if (
        currentNode &&
        currentNode.children &&
        currentNode.children.length > 0
      ) {
        const rhsNodes = currentNode.children;
        const avgX =
          rhsNodes.reduce((sum: number, n: any) => sum + (n.x || 0), 0) /
          rhsNodes.length;
        const avgY =
          rhsNodes.reduce((sum: number, n: any) => sum + (n.y || 0), 0) /
          rhsNodes.length;

        const svgWidth = dimensions.width;
        const svgHeight = dimensions.height;

        const transform = d3.zoomIdentity
          .translate(svgWidth / 2 - (avgY + margin.left), svgHeight / 2 - avgX)
          .scale(1);

        svg
          .transition()
          .duration(750)
          .call(zoom.transform as any, transform);
      }
    }
  }, [
    buildD3Tree,
    dimensions,
    searchPath,
    searchTree,
    selectedTokenId,
    handleTokenClick,
    handlePromptTokenClick,
  ]);

  // Handle dragging for generated text box
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - textBoxPosition.x,
        y: e.clientY - textBoxPosition.y,
      });
    },
    [textBoxPosition]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setTextBoxPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Get current prompt from search path
  const currentPrompt = buildPromptFromPath();

  return (
    <div className={styles.svgContainer}>
      {/* Draggable Generated Text Box */}
      <div
        className={styles.textBox}
        style={{
          left: `${textBoxPosition.x}px`,
          top: `${textBoxPosition.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.textBoxTitle}>Generated Text</div>
        <div className={styles.textBoxContent}>{currentPrompt}</div>
      </div>

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className={styles.svgCanvas}
      />
    </div>
  );
};

export const UserSearchTreeD3 = ({ initialPrompt }: UserSearchTreeD3Props) => {
  const { selectedLM } = useLMSettings();

  const handleInitialize = useCallback(
    async (
      prompt: string,
      addChildren: (tokens: string[], probabilities: number[]) => void
    ) => {
      try {
        const data = await getTokenProbabilities(prompt, selectedLM);
        addChildren(data.tokens, data.probabilities);
      } catch (error) {
        console.error("Error fetching initial tokens:", error);
      }
    },
    [selectedLM]
  );

  return (
    <SearchTreeProvider
      initialPrompt={initialPrompt}
      onInitialize={handleInitialize}
    >
      <UserSearchTreeD3Content />
    </SearchTreeProvider>
  );
};
