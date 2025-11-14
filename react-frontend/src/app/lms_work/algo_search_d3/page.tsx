"use client";

import { AlgoSearchTreeD3 } from "@/components/search_tokens/algoSearchTreeD3";
import { LMTextarea } from "@/components/lmTextarea";
import Navbar from "@/components/navigation/navBar";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";

export default function AlgoSearchPageD3() {
  const [prompt, setPrompt] = useState<string>("");
  const [showTree, setShowTree] = useState<boolean>(false);

  const handleGenerationComplete = useCallback((generatedText: string) => {
    setPrompt(generatedText);
    setShowTree(true);
  }, []);

  return (
    <div>
      <Navbar />
      <div
        style={{
          marginLeft: "1rem",
          marginTop: "1rem",
          width: "calc(100vw - 2rem)",
        }}
      >
        <LMTextarea onSend={handleGenerationComplete} />
        {showTree && (
          <AlgoSearchTreeD3
            key={prompt}
            initialPrompt={prompt}
            autoStart={true}
            renderControls={({
              isAutoPlay,
              setIsAutoPlay,
              isPlaying,
              handlePlayPause,
              handleStepForward,
              handleStepBackward,
              currentStepIndex,
              totalSteps,
              isProcessingStep,
            }: {
              isAutoPlay: boolean;
              setIsAutoPlay: (value: boolean) => void;
              isPlaying: boolean;
              handlePlayPause: () => void;
              handleStepForward: () => void;
              handleStepBackward: () => void;
              currentStepIndex: number;
              totalSteps: number;
              isProcessingStep: boolean;
            }) => (
              <div
                style={{
                  marginBottom: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  padding: "0.5rem",
                  background: "#f9fafb",
                  borderRadius: "0.375rem",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#666",
                  }}
                >
                  Step {currentStepIndex} / {totalSteps}
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
                          currentStepIndex >= totalSteps || isProcessingStep
                        }
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
