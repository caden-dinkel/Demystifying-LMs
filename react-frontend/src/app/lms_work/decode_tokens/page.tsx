"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/navigation/navBar";
import { LMTextarea } from "@/components/lmTextarea";
import { TokenSearch } from "@/components/search_tokens/userSearchTree";
import { AlgoSearchTreeNew } from "@/components/search_tokens/algoSearchTreeNew";
import { ConnectorLayoutProvider } from "@/components/search_tokens/useConnectorLayout";
import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";

import styles from "@/styles/main-layout.module.css";

export default function SearchingForWords() {
  const [prompt, setPrompt] = useState<string>("");
  const [showTree, setShowTree] = useState<boolean>(false);
  const [searchMode, setSearchMode] = useState<"manual" | "algorithmic">(
    "manual"
  );

  const handleStartSearch = useCallback((userPrompt: string) => {
    setPrompt(userPrompt);
    setShowTree(true);
  }, []);

  return (
    <div>
      <Navbar />
      <main className={styles.baseMain}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Searching for Words
          </h1>
          <p className="text-muted-foreground">
            Explore how language models search through possible tokens to
            generate text.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-4 flex gap-2">
          <Button
            onClick={() => setSearchMode("manual")}
            variant={searchMode === "manual" ? "default" : "outline"}
          >
            Manual Selection
          </Button>
          <Button
            onClick={() => setSearchMode("algorithmic")}
            variant={searchMode === "algorithmic" ? "default" : "outline"}
          >
            Algorithmic Search
          </Button>
        </div>

        <LMTextarea onSend={handleStartSearch} />

        {showTree && (
          <ConnectorLayoutProvider>
            {searchMode === "manual" ? (
              <TokenSearch key={`manual-${prompt}`} initialPrompt={prompt} />
            ) : (
              <AlgoSearchTreeNew
                key={`algo-${prompt}`}
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
                      height: "100px",
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
                            disabled={
                              currentStepIndex === 0 || isProcessingStep
                            }
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
          </ConnectorLayoutProvider>
        )}
      </main>
    </div>
  );
}
