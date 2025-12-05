//algoSearchTree.tsx
import styles from "@/styles/tokens.module.css";
import React from "react";
import { useRef, useEffect, useCallback, useState } from "react";
import { postIterativeGeneration } from "@/api/postIterativeGeneration";
import { StepData } from "@/utilities/types";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import { useConnectorLayout } from "./useConnectorLayout";
import { SearchTreeProvider, useSearchTree } from "./useSearchTree";
import { PromptDisplay } from "./promptDisplay";
import { SearchTreeConnector } from "./treeBranches";
import { TokenMap } from "./tokenMap";
import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";

export interface AlgoSearchTreeProps {
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

// Inner component that uses the context
const AlgoSearchTreeContent = ({
  autoStart = false,
  onGenerationComplete,
  renderControls,
}: {
  autoStart?: boolean;
  onGenerationComplete?: () => void;
  renderControls?: AlgoSearchTreeProps["renderControls"];
}) => {
  const { selectedLM, temperature, maxTokens, selectedSearchMethod } =
    useLMSettings();
  const {
    lhsBox,
    rhsBoxes,
    parentContainer,
    handleLHSTokenRender,
    handleRHSTokenRender,
    setParentContainer,
  } = useConnectorLayout();

  const {
    lhsTokenData,
    rhsTokenData,
    addChildrenToNode,
    selectNode,
    deselectNode,
    moveToNode,
    navigateBack,
    getNodeById,
    currentPrompt,
    setAnimationData,
  } = useSearchTree();

  const containerRef = useRef<HTMLDivElement>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepsData, setStepsData] = useState<StepData[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(true); // Toggle between manual and autoplay
  const [animatingTokenIndex, setAnimatingTokenIndex] = useState<number | null>(
    null
  );
  const [isProcessingStep, setIsProcessingStep] = useState(false);
  const [displayedRHSTokens, setDisplayedRHSTokens] = useState<
    typeof rhsTokenData
  >([]);

  // Update parent container rect when component mounts or layout changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateRect = () => {
      const rect = container.getBoundingClientRect();
      setParentContainer(rect);
    };

    updateRect();

    // Update on resize or when tokens change
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [setParentContainer, lhsTokenData.length, rhsTokenData.length]);

  // Fetch all steps from iterative generation API
  const fetchIterativeGeneration = useCallback(async () => {
    try {
      // Use the current prompt from the search tree context
      console.log("Fetching with prompt:", currentPrompt);

      const response = await postIterativeGeneration(
        currentPrompt,
        selectedLM,
        {
          search_strategy: selectedSearchMethod,
          temperature: temperature[0], // Get first value from slider array
          max_tokens: maxTokens,
        }
      );

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
      const currentNodeId =
        lhsTokenData[lhsTokenData.length - 1]?.id || "initial";

      console.log(`Step ${stepIndex + 1}: Processing token selection`);

      // First, check if we need to move from a previously selected token
      // (This happens when executing the next step after a previous selection)
      const previousStepIndex = stepIndex - 1;
      if (previousStepIndex >= 0) {
        const previousStep = stepsData[previousStepIndex];
        const previousNodeId = lhsTokenData[lhsTokenData.length - 1]?.id;

        // Find the previously chosen token
        const previousNode = getNodeById(previousNodeId);
        if (previousNode && previousNode.isSelected) {
          // Move to it now so we can show the new children
          moveToNode(previousNodeId);
        }
      }

      // Small delay to let the move complete
      setTimeout(() => {
        // Add the top_k tokens as children to the current node
        const newChildIds = addChildrenToNode(
          currentNodeId,
          step.top_k_tokens,
          step.top_k_probs,
          step.top_k_token_ids
        );

        // Store these tokens in displayedRHSTokens so they persist
        const newRHSTokens = step.top_k_tokens
          .map((token, idx) => ({
            id: newChildIds[idx],
            token: token,
            prob: step.top_k_probs[idx],
            probability: step.top_k_probs[idx],
            token_id: step.top_k_token_ids?.[idx],
          }))
          .filter((token) => token.id !== undefined); // Only include tokens with valid IDs
        setDisplayedRHSTokens(newRHSTokens);

        // Find which index in top_k_tokens matches the chosen token
        const chosenTokenIndex = step.top_k_tokens.findIndex(
          (token) => token === step.chosen_token
        );

        if (chosenTokenIndex !== -1 && newChildIds[chosenTokenIndex]) {
          const chosenTokenId = newChildIds[chosenTokenIndex];

          // Wait for RHS to render, then start animation
          setTimeout(() => {
            // Get the button element for the chosen token to get its coordinates
            const chosenButton = document.querySelector(
              `button[data-token-id="${chosenTokenId}"]`
            ) as HTMLElement;

            if (chosenButton) {
              const startCoords = chosenButton.getBoundingClientRect();
              setAnimationData({ startCoords, endId: chosenTokenId });
            }

            // Start the animation
            setAnimatingTokenIndex(chosenTokenIndex);

            // Wait for animation to complete (500ms)
            setTimeout(() => {
              // Stop animation
              setAnimatingTokenIndex(null);

              // Now perform the selection
              deselectNode(currentNodeId);
              selectNode(chosenTokenId);

              // Move to the selected node (this will update rhsTokenData for the next step)
              moveToNode(chosenTokenId);

              // Keep displayedRHSTokens as is - they'll be replaced when next step executes
              setIsProcessingStep(false);
            }, 500); // Animation duration
          }, 100); // Small delay to ensure RHS is rendered
        } else {
          console.error("Could not find chosen token in top_k_tokens!", {
            chosen: step.chosen_token,
            available: step.top_k_tokens,
          });
          setIsProcessingStep(false);
        }
      }, 50);
    },
    [
      stepsData,
      lhsTokenData,
      isProcessingStep,
      addChildrenToNode,
      selectNode,
      deselectNode,
      moveToNode,
      setAnimationData,
      getNodeById,
    ]
  );

  // Autoplay effect - executes steps automatically when playing
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
    }, 1500); // 1500ms delay between steps

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

  // Manual navigation handlers
  const handleStepForward = useCallback(() => {
    if (currentStepIndex < stepsData.length && !isProcessingStep) {
      executeStep(currentStepIndex);
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [currentStepIndex, stepsData.length, isProcessingStep, executeStep]);

  const handleStepBackward = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      // Navigate back in the tree
      const targetIndex = currentStepIndex - 1;
      // Get the node at that position in lhsTokenData
      if (lhsTokenData[targetIndex]) {
        navigateBack(lhsTokenData[targetIndex].id);
      }
    }
  }, [currentStepIndex, lhsTokenData, navigateBack]);

  const handlePlayPause = useCallback(() => {
    if (stepsData.length === 0) {
      fetchIterativeGeneration();
    } else {
      setIsPlaying(!isPlaying);
    }
  }, [stepsData.length, isPlaying, fetchIterativeGeneration]);

  // Allow manual navigation (click on prompt tokens to go back)
  const handlePrevNode = useCallback(
    (selectedNodeID: string) => {
      navigateBack(selectedNodeID);
      setIsPlaying(false); // Stop playback when user intervenes
    },
    [navigateBack]
  );

  // Disable manual selection in algo mode
  const handleTokenClick = useCallback((tokenId: string) => {}, []);

  // Auto-start generation when component mounts if autoStart is true
  // Wait for currentPrompt to be available before starting
  useEffect(() => {
    if (
      autoStart &&
      !isPlaying &&
      stepsData.length === 0 &&
      currentPrompt &&
      currentPrompt.trim() !== ""
    ) {
      console.log("Auto-starting with prompt:", currentPrompt);
      fetchIterativeGeneration();
    }
  }, [
    autoStart,
    isPlaying,
    stepsData.length,
    currentPrompt,
    fetchIterativeGeneration,
  ]);

  return (
    <div
      className={styles.animationContainer}
      ref={containerRef}
      data-search-tree-container
    >
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
      <div className={styles.contentContainer}>
        <div className={styles.lhsContainer}>
          {(rhsBoxes.length > 0 || displayedRHSTokens.length > 0) && (
            <PromptDisplay
              currentTokens={lhsTokenData}
              onNodeClick={handlePrevNode}
              onContainerRender={handleLHSTokenRender}
            />
          )}
          {!renderControls && stepsData.length > 0 && (
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  padding: "0.5rem",
                  color: "#666",
                }}
              >
                Step {currentStepIndex} / {stepsData.length}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                }}
              >
                <Button
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                  variant={isAutoPlay ? "default" : "outline"}
                  size="sm"
                >
                  {isAutoPlay ? "Auto" : "Manual"}
                </Button>
                {isAutoPlay ? (
                  <Button
                    onClick={handlePlayPause}
                    variant="outline"
                    size="sm"
                    disabled={isProcessingStep}
                  >
                    {isPlaying ? (
                      <>
                        <PauseIcon className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <PlayIcon className="mr-2 h-4 w-4" />
                        Play
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleStepBackward}
                      variant="outline"
                      size="sm"
                      disabled={currentStepIndex === 0 || isProcessingStep}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleStepForward}
                      variant="outline"
                      size="sm"
                      disabled={
                        currentStepIndex >= stepsData.length || isProcessingStep
                      }
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className={styles.rhsContainer}>
          <div className={styles.tokenMapContainer}>
            <TokenMap
              key={
                displayedRHSTokens.length > 0
                  ? `displayed-${displayedRHSTokens[0]?.id}`
                  : `default-${rhsTokenData[0]?.id}`
              }
              tokenData={
                displayedRHSTokens.length > 0
                  ? displayedRHSTokens
                  : rhsTokenData
              }
              onSelection={handleTokenClick}
              onRender={handleRHSTokenRender}
            />
          </div>
        </div>
      </div>
      {lhsBox && rhsBoxes.length > 0 && parentContainer && (
        <SearchTreeConnector
          lhsBox={lhsBox}
          rhsBoxes={rhsBoxes}
          parentRect={parentContainer}
          animatingTokenIndex={animatingTokenIndex}
        />
      )}
    </div>
  );
};

// Wrapper component that provides the context
export const AlgoSearchTree = ({
  initialPrompt,
  autoStart = false,
  onGenerationComplete,
}: AlgoSearchTreeProps) => {
  const { selectedLM } = useLMSettings();

  // Handler for initial API call when tree is initialized
  // For algo mode, we just initialize with the prompt, no initial children
  const handleInitialize = useCallback(
    async (
      prompt: string,
      addChildren: (tokens: string[], probabilities: number[]) => void
    ) => {
      try {
        // Initialize empty - user will click "Start Generation" button
        console.log("[ALGO] Initialized with prompt:", prompt);
      } catch (error) {
        console.error("Error initializing:", error);
      }
    },
    [selectedLM]
  );

  return (
    <SearchTreeProvider
      initialPrompt={initialPrompt}
      onInitialize={handleInitialize}
    >
      <AlgoSearchTreeContent
        autoStart={autoStart}
        onGenerationComplete={onGenerationComplete}
      />
    </SearchTreeProvider>
  );
};
