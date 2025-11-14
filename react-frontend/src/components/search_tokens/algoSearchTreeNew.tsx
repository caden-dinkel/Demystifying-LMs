//algoSearchTreeNew.tsx
"use client";
import styles from "@/styles/tokens.module.css";
import React, { useRef, useEffect, useCallback, useState } from "react";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import { useConnectorLayout } from "./useConnectorLayout";
import { SearchTreeProvider, useSearchTree } from "./useSearchTree";
import { PromptDisplay } from "./promptDisplay";
import { SearchTreeConnector } from "./treeBranches";
import { TokenMap } from "./tokenMap";
import { GeneratedTextBox } from "./generatedTextBox";
import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { lmClient } from "@/api/lmClient";
import { IterativeGenerationResponse, StepData } from "@/utilities/types";

export interface AlgoSearchTreeNewProps {
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
const AlgoSearchTreeNewContent = ({
  autoStart = false,
  onGenerationComplete,
  renderControls,
}: {
  autoStart?: boolean;
  onGenerationComplete?: () => void;
  renderControls?: AlgoSearchTreeNewProps["renderControls"];
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
    currentPrompt,
    setAnimationData,
  } = useSearchTree();

  const containerRef = useRef<HTMLDivElement>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepsData, setStepsData] = useState<StepData[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [animatingTokenIndex, setAnimatingTokenIndex] = useState<number | null>(
    null
  );
  const [isProcessingStep, setIsProcessingStep] = useState(false);

  // Simple state to track which tokens to display on RHS
  // This will be the ONLY source of truth for RHS display
  const [displayTokens, setDisplayTokens] = useState<{
    tokens: string[];
    probs: number[];
    ids: string[];
    token_ids: number[];
  } | null>(null);

  // Update parent container rect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateRect = () => {
      const rect = container.getBoundingClientRect();
      setParentContainer(rect);
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [setParentContainer, lhsTokenData.length]);

  // Fetch all steps from iterative generation API
  const fetchIterativeGeneration = useCallback(async () => {
    try {
      console.log("Fetching with prompt:", currentPrompt);

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
      const currentNodeId =
        lhsTokenData[lhsTokenData.length - 1]?.id || "initial";

      console.log(`Step ${stepIndex + 1}: Processing token selection`);

      // Add the top_k tokens as children to the current node
      const newChildIds = addChildrenToNode(
        currentNodeId,
        step.top_k_tokens,
        step.top_k_probs,
        step.top_k_token_ids
      );

      // Set display tokens with unique IDs - this is the ONLY place we set them
      setDisplayTokens({
        tokens: step.top_k_tokens,
        probs: step.top_k_probs,
        ids: newChildIds,
        token_ids: step.top_k_token_ids,
      });

      // Find which token was chosen
      const chosenTokenIndex = step.top_k_tokens.findIndex(
        (token) => token === step.chosen_token
      );

      if (chosenTokenIndex !== -1 && newChildIds[chosenTokenIndex]) {
        const chosenTokenId = newChildIds[chosenTokenIndex];

        // Wait for RHS to render, then start animation
        setTimeout(() => {
          const chosenButton = document.querySelector(
            `button[data-token-id="${chosenTokenId}"]`
          ) as HTMLElement;

          if (chosenButton) {
            const startCoords = chosenButton.getBoundingClientRect();
            setAnimationData({ startCoords, endId: chosenTokenId });
          }

          // Start the animation
          setAnimatingTokenIndex(chosenTokenIndex);

          // Wait for animation to complete
          setTimeout(() => {
            // Stop animation
            setAnimatingTokenIndex(null);

            // Perform the selection
            deselectNode(currentNodeId);
            selectNode(chosenTokenId);
            moveToNode(chosenTokenId);

            setIsProcessingStep(false);
          }, 500); // Animation duration
        }, 100); // Small delay to ensure RHS is rendered
      } else {
        console.error("Could not find chosen token in top_k_tokens!");
        setIsProcessingStep(false);
      }
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

  // Allow manual navigation on prompt tokens
  const handlePrevNode = useCallback(
    (selectedNodeID: string) => {
      navigateBack(selectedNodeID);
      setIsPlaying(false);
    },
    [navigateBack]
  );

  // Disable manual token selection in algo mode
  const handleTokenClick = useCallback(() => {}, []);

  // Auto-start generation when component mounts if autoStart is true
  useEffect(() => {
    if (autoStart && stepsData.length === 0 && currentPrompt) {
      fetchIterativeGeneration();
    }
  }, [autoStart, currentPrompt, stepsData.length, fetchIterativeGeneration]);

  // Convert displayTokens to TokenData format for rendering
  const displayTokenData =
    displayTokens?.tokens.map((token, idx) => ({
      id: displayTokens.ids[idx],
      token: token,
      prob: displayTokens.probs[idx],
      token_id: displayTokens.token_ids[idx],
    })) || [];

  return (
    <div
      className={styles.animationContainer}
      ref={containerRef}
      data-search-tree-container
    >
      {/* Draggable Generated Text Box */}
      <GeneratedTextBox text={currentPrompt} />

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
          {(rhsBoxes.length > 0 || displayTokenData.length > 0) && (
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
              tokenData={displayTokenData}
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
export const AlgoSearchTreeNew = ({
  initialPrompt,
  autoStart = false,
  onGenerationComplete,
  renderControls,
}: AlgoSearchTreeNewProps) => {
  const { selectedLM } = useLMSettings();

  const handleInitialize = useCallback(
    async (
      prompt: string,
      addChildren: (tokens: string[], probabilities: number[]) => void
    ) => {
      // For algo mode, we just initialize with the prompt, no initial children
      console.log("Initializing algo search tree with prompt:", prompt);
    },
    []
  );

  return (
    <SearchTreeProvider
      initialPrompt={initialPrompt}
      onInitialize={handleInitialize}
    >
      <AlgoSearchTreeNewContent
        autoStart={autoStart}
        onGenerationComplete={onGenerationComplete}
        renderControls={renderControls}
      />
    </SearchTreeProvider>
  );
};
