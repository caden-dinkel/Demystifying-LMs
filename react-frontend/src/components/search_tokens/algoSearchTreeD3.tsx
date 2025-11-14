"use client";
import React, { useRef, useEffect, useCallback, useState } from "react";
import * as d3 from "d3";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import { SearchTreeProvider, useSearchTree } from "./useSearchTree";
import { lmClient } from "@/api/lmClient";
import { IterativeGenerationResponse, StepData } from "@/utilities/types";
import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";

export interface AlgoSearchTreeD3Props {
  initialPrompt: string;
  autoStart?: boolean;
  onGenerationComplete?: () => void;
  renderControls?: (controlsProps: {
    isAutoPlay: boolean;
    setIsAutoPlay: (value: boolean) => void;
    isPlaying: boolean;
    handlePlayPause: () => void;
    handleStepForward: () => void;
    handleStepBackward: () => void;
    currentStepIndex: number;
    totalSteps: number;
    isProcessingStep: boolean;
  }) => React.ReactNode;
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
  isAnimating?: boolean;
  shouldShow?: boolean; // Whether this node should be visible
}

const AlgoSearchTreeD3Content = ({
  autoStart = false,
  onGenerationComplete,
  renderControls,
}: {
  autoStart?: boolean;
  onGenerationComplete?: () => void;
  renderControls?: AlgoSearchTreeD3Props["renderControls"];
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomTransformRef = useRef<d3.ZoomTransform | null>(null);
  const lastPathLengthRef = useRef<number>(0);
  const { selectedLM, temperature, maxTokens, selectedSearchMethod } =
    useLMSettings();
  const {
    searchTree,
    searchPath,
    addChildrenToNode,
    selectNode,
    deselectNode,
    moveToNode,
    currentPrompt,
  } = useSearchTree();

  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepsData, setStepsData] = useState<StepData[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isProcessingStep, setIsProcessingStep] = useState(false);
  const [animatingNodeId, setAnimatingNodeId] = useState<string | null>(null);
  const [textBoxPosition, setTextBoxPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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

  // Fetch all steps from iterative generation API
  const fetchIterativeGeneration = useCallback(async () => {
    try {
      const response = (await lmClient.iterativeGeneration(
        currentPrompt,
        selectedLM,
        {
          search_strategy: selectedSearchMethod,
          temperature: temperature[0],
          max_tokens: maxTokens,
        }
      )) as IterativeGenerationResponse;

      setStepsData(response.steps);
      setCurrentStepIndex(0);
      if (isAutoPlay) {
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error fetching iterative generation:", error);
    }
  }, [
    currentPrompt,
    selectedLM,
    selectedSearchMethod,
    temperature,
    maxTokens,
    isAutoPlay,
  ]);

  // Execute a single step
  const executeStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= stepsData.length || stepIndex < 0 || isProcessingStep) {
        return;
      }

      setIsProcessingStep(true);
      const step = stepsData[stepIndex];
      const currentNodeId = searchPath[searchPath.length - 1] || "initial";

      // Add the top_k tokens as children
      const newChildIds = addChildrenToNode(
        currentNodeId,
        step.top_k_tokens,
        step.top_k_probs,
        step.top_k_token_ids
      );

      // Find chosen token
      const chosenTokenIndex = step.top_k_tokens.findIndex(
        (token) => token === step.chosen_token
      );

      if (chosenTokenIndex !== -1 && newChildIds[chosenTokenIndex]) {
        const chosenTokenId = newChildIds[chosenTokenIndex];

        // Animate the chosen token
        setAnimatingNodeId(chosenTokenId);

        // In manual mode, don't automatically complete the step
        if (!isAutoPlay) {
          // Keep tokens visible and animating until user clicks next
          // Don't call moveToNode yet - wait for next click
          setIsProcessingStep(false); // Reset processing flag so buttons work
          return;
        }

        // In autoplay mode, complete the step after animation duration
        setTimeout(() => {
          setAnimatingNodeId(null);
          deselectNode(currentNodeId);
          selectNode(chosenTokenId);
          moveToNode(chosenTokenId);
          setIsProcessingStep(false);
        }, 2500); // Animation duration - time to view RHS tokens
      } else {
        console.error("Could not find chosen token!");
        setIsProcessingStep(false);
      }
    },
    [
      stepsData,
      searchPath,
      isProcessingStep,
      isAutoPlay,
      addChildrenToNode,
      selectNode,
      deselectNode,
      moveToNode,
    ]
  );

  // Autoplay effect
  useEffect(() => {
    if (!isPlaying || !isAutoPlay || isProcessingStep) {
      return;
    }

    if (currentStepIndex >= stepsData.length) {
      setIsPlaying(false);
      if (onGenerationComplete) {
        onGenerationComplete();
      }
      return;
    }

    const timer = setTimeout(() => {
      executeStep(currentStepIndex);
      setCurrentStepIndex((prev) => prev + 1);
    }, 500); // Delay before starting next step

    return () => clearTimeout(timer);
  }, [
    isPlaying,
    isAutoPlay,
    currentStepIndex,
    stepsData.length,
    isProcessingStep,
    executeStep,
    onGenerationComplete,
  ]);

  // Auto-start generation
  useEffect(() => {
    if (autoStart && stepsData.length === 0 && currentPrompt) {
      fetchIterativeGeneration();
    }
  }, [autoStart, currentPrompt, stepsData.length, fetchIterativeGeneration]);

  // Manual navigation handlers
  const handleStepForward = useCallback(() => {
    // If we're in manual mode and there's an animating node, complete that step first
    if (!isAutoPlay && animatingNodeId && !isProcessingStep) {
      const currentNodeId = searchPath[searchPath.length - 1] || "initial";
      setAnimatingNodeId(null);
      deselectNode(currentNodeId);
      selectNode(animatingNodeId);
      moveToNode(animatingNodeId);
      setIsProcessingStep(false);
      return;
    }

    // Otherwise, execute the next step
    if (currentStepIndex < stepsData.length && !isProcessingStep) {
      executeStep(currentStepIndex);
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [
    currentStepIndex,
    stepsData.length,
    isProcessingStep,
    isAutoPlay,
    animatingNodeId,
    searchPath,
    deselectNode,
    selectNode,
    moveToNode,
    executeStep,
  ]);

  const handleStepBackward = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const handlePlayPause = useCallback(() => {
    if (stepsData.length === 0) {
      fetchIterativeGeneration();
    } else {
      setIsPlaying(!isPlaying);
    }
  }, [stepsData.length, isPlaying, fetchIterativeGeneration]);

  // Convert searchTree to D3 hierarchy - keep all nodes but mark which to show
  const buildD3Tree = useCallback((): D3Node | null => {
    if (searchPath.length === 0) return null;

    // Get the current node (last in path)
    const currentNodeId = searchPath[searchPath.length - 1];
    const currentNode = searchTree.get(currentNodeId);
    if (!currentNode) return null;

    // Build full tree structure with visibility flags
    const buildNode = (nodeId: string, depth: number): D3Node | null => {
      const node = searchTree.get(nodeId);
      if (!node) return null;

      const isInPath = searchPath.includes(nodeId);
      const isCurrentNode = nodeId === currentNodeId;
      const hasChildren = node.childrenNodeIds.length > 0;

      const d3Node: D3Node = {
        id: node.id,
        token: node.token,
        prob: node.prob,
        x: 0,
        y: 0,
        isSelected: node.isSelected,
        isAnimating: animatingNodeId === node.id,
        shouldShow: isInPath || (isCurrentNode && hasChildren),
      };

      // Always include children in structure, but mark visibility
      if (hasChildren) {
        if (isCurrentNode) {
          // Current node: show all children
          d3Node.children = node.childrenNodeIds
            .map((childId) => {
              const childNode = buildNode(childId, depth + 1);
              if (childNode) {
                childNode.shouldShow = true;
              }
              return childNode;
            })
            .filter((n): n is D3Node => n !== null);
        } else if (isInPath && depth < searchPath.length - 1) {
          // Path node: include all children but only show the next in path
          const nextNodeId = searchPath[depth + 1];
          d3Node.children = node.childrenNodeIds
            .map((childId) => {
              const childNode = buildNode(childId, depth + 1);
              if (childNode) {
                childNode.shouldShow = childId === nextNodeId;
              }
              return childNode;
            })
            .filter((n): n is D3Node => n !== null);
        }
      }

      return d3Node;
    };

    return buildNode(searchPath[0], 0);
  }, [searchTree, searchPath, animatingNodeId]);

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
        // Only center based on VISIBLE children (shouldShow: true)
        const visibleChildren = d.children.filter(
          (child) => child.data.shouldShow
        );

        if (visibleChildren.length > 0) {
          // Calculate the vertical center of visible children only
          const childXValues = visibleChildren.map((child) => child.x || 0);
          const minChildX = Math.min(...childXValues);
          const maxChildX = Math.max(...childXValues);
          const childrenCenter = (minChildX + maxChildX) / 2;

          // Calculate offset needed to center children around parent
          const parentX = d.x || 0;
          const offset = parentX - childrenCenter;

          // Apply offset to ALL children (visible and hidden)
          d.children.forEach((child) => {
            if (child.x !== undefined) {
              child.x += offset;
            }
          });
        }
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
      )
      .style("opacity", (d) => (d.target.data.shouldShow ? 0 : 0))
      .transition()
      .duration(500)
      .style("opacity", (d) => (d.target.data.shouldShow ? 1 : 0));

    // Draw nodes
    const nodes = g
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.y},${d.x})`);

    // Add background rect for better token display
    nodes
      .append("rect")
      .attr("x", -45)
      .attr("y", -18)
      .attr("width", 90)
      .attr("height", 36)
      .attr("rx", 6)
      .attr("fill", (d) => {
        if (d.data.isAnimating) return "#fef3c7";
        if (d.data.isSelected) return "#dbeafe";
        if (searchPath.includes(d.data.id)) return "#e0f2fe";
        return "#f8fafc";
      })
      .attr("stroke", (d) => {
        if (d.data.isAnimating) return "#f59e0b";
        if (d.data.isSelected) return "#3b82f6";
        if (searchPath.includes(d.data.id)) return "#60a5fa";
        return "#cbd5e1";
      })
      .attr("stroke-width", (d) => (d.data.isAnimating ? 3 : 2))
      .style("opacity", (d) => (d.data.shouldShow ? 0 : 0))
      .transition()
      .duration(500)
      .style("opacity", (d) => (d.data.shouldShow ? 1 : 0));

    // Add token text
    nodes
      .append("text")
      .attr("dy", -3)
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .attr("font-weight", (d) => (d.data.isSelected ? "600" : "500"))
      .attr("fill", "#1e293b")
      .style("opacity", (d) => (d.data.shouldShow ? 0 : 0))
      .text((d) => d.data.token)
      .style("pointer-events", "none")
      .transition()
      .duration(500)
      .style("opacity", (d) => (d.data.shouldShow ? 1 : 0));

    // Add probability text
    nodes
      .append("text")
      .attr("dy", 11)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("fill", "#64748b")
      .style("opacity", (d) => (d.data.shouldShow ? 0 : 0))
      .text((d) => `${(d.data.prob * 100).toFixed(1)}%`)
      .style("pointer-events", "none")
      .transition()
      .duration(500)
      .style("opacity", (d) => (d.data.shouldShow ? 1 : 0));

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
      .attr("fill", "#e5e7eb")
      .style("opacity", (d) => (d.data.shouldShow ? 0 : 0))
      .transition()
      .duration(500)
      .style("opacity", (d) => (d.data.shouldShow ? 1 : 0));

    nodes
      .append("rect")
      .attr("x", -barWidth / 2)
      .attr("y", barY)
      .attr("width", (d) => d.data.prob * barWidth)
      .attr("height", barHeight)
      .attr("rx", 2)
      .attr("fill", (d) => {
        if (d.data.isAnimating) return "#f59e0b";
        if (d.data.isSelected) return "#3b82f6";
        return "#60a5fa";
      })
      .style("opacity", (d) => (d.data.shouldShow ? 0 : 0))
      .transition()
      .duration(500)
      .style("opacity", (d) => (d.data.shouldShow ? 1 : 0));

    // Draw prompt path
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
      .each(function (d) {
        const g = d3.select(this);

        g.append("rect")
          .attr("x", -35)
          .attr("y", -12)
          .attr("width", 70)
          .attr("height", 24)
          .attr("rx", 4)
          .attr("fill", d.isSelected ? "#dbeafe" : "#f1f5f9")
          .attr("stroke", "#94a3b8")
          .attr("stroke-width", 1);

        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "11px")
          .attr("fill", "#1e293b")
          .text(d.token);
      });

    // Center viewport on RHS tokens only when path grows (new token selected)
    const shouldRecenter = searchPath.length > lastPathLengthRef.current;
    lastPathLengthRef.current = searchPath.length;

    if (shouldRecenter) {
      const currentNodeId = searchPath[searchPath.length - 1];
      const currentNodeDescendant = root
        .descendants()
        .find((d) => d.data.id === currentNodeId);

      if (
        currentNodeDescendant &&
        currentNodeDescendant.children &&
        currentNodeDescendant.children.length > 0
      ) {
        // Only center on VISIBLE children
        const visibleRhsNodes = currentNodeDescendant.children.filter(
          (child) => child.data.shouldShow
        );

        if (visibleRhsNodes.length > 0) {
          // Calculate the center of the visible RHS tokens
          let sumX = 0,
            sumY = 0;
          visibleRhsNodes.forEach((child) => {
            sumX += child.x || 0;
            sumY += child.y || 0;
          });
          const centerX = sumY / visibleRhsNodes.length; // y in data is horizontal position
          const centerY = sumX / visibleRhsNodes.length; // x in data is vertical position

          // Calculate the transform to center these nodes in the viewport
          const svgElement = svgRef.current;
          if (svgElement) {
            const svgRect = svgElement.getBoundingClientRect();
            const viewportCenterX = svgRect.width / 2;
            const viewportCenterY = svgRect.height / 2;

            // Calculate translation needed, preserving current zoom level
            const currentScale = zoomTransformRef.current?.k || 1;
            const translateX =
              viewportCenterX -
              centerX * currentScale -
              margin.left * currentScale;
            const translateY =
              viewportCenterY -
              centerY * currentScale -
              margin.top * currentScale;

            // Apply smooth transition to center on RHS tokens
            const transform = d3.zoomIdentity
              .translate(translateX, translateY)
              .scale(currentScale);

            svg
              .transition()
              .duration(750)
              .call(zoom.transform as any, transform);
          }
        }
      }
    }
  }, [buildD3Tree, dimensions, searchPath, searchTree]);

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

  return (
    <div style={{ width: "100%", minHeight: "600px", position: "relative" }}>
      {/* Draggable Generated Text Box */}
      <div
        style={{
          position: "absolute",
          left: `${textBoxPosition.x}px`,
          top: `${textBoxPosition.y}px`,
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1rem",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
          minWidth: "300px",
          maxWidth: "500px",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          style={{
            fontWeight: "600",
            fontSize: "0.875rem",
            color: "#374151",
            marginBottom: "0.5rem",
            userSelect: "none",
          }}
        >
          Generated Text
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "0.875rem",
            color: "#111827",
            lineHeight: "1.5",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {currentPrompt}
        </div>
      </div>
      {renderControls &&
        stepsData.length > 0 &&
        renderControls({
          isAutoPlay,
          setIsAutoPlay,
          isPlaying,
          handlePlayPause,
          handleStepForward,
          handleStepBackward,
          currentStepIndex,
          totalSteps: stepsData.length,
          isProcessingStep,
        })}
      <div style={{ width: "100%", height: "600px", overflow: "auto" }}>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            minWidth: "100%",
            minHeight: "100%",
          }}
        />
      </div>
    </div>
  );
};

export const AlgoSearchTreeD3 = ({
  initialPrompt,
  autoStart = false,
  onGenerationComplete,
  renderControls,
}: AlgoSearchTreeD3Props) => {
  const handleInitialize = useCallback(
    async (
      prompt: string,
      addChildren: (tokens: string[], probabilities: number[]) => void
    ) => {
      console.log("Initializing algo search tree with prompt:", prompt);
    },
    []
  );

  return (
    <SearchTreeProvider
      initialPrompt={initialPrompt}
      onInitialize={handleInitialize}
    >
      <AlgoSearchTreeD3Content
        autoStart={autoStart}
        onGenerationComplete={onGenerationComplete}
        renderControls={renderControls}
      />
    </SearchTreeProvider>
  );
};
