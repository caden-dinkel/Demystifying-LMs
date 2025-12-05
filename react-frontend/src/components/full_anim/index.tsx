"use client";

import React, { useState, useEffect } from "react";
import { Prompt } from "./prompt";
import { TokensList } from "./tokens_list";
import { Model } from "./model";
import { LogitsProb } from "./logits_prob";
import { Sampling } from "./sampling";
import { Arrows } from "./arrows";
import { Button } from "@/components/ui/button";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import { postTokenizeText } from "@/api/postTokenizeText";
import { getTokenProbabilities } from "@/api/getTokenProbs";
import { PlayIcon, PauseIcon, RotateCcwIcon } from "lucide-react";

interface FullGenerationProcessProps {
  initialPrompt: string;
  autoStart?: boolean;
}

export const FullGenerationProcess: React.FC<FullGenerationProcessProps> = ({
  initialPrompt,
  autoStart = false,
}) => {
  const { selectedLM } = useLMSettings();
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [tokens, setTokens] = useState<string[]>([]);
  const [topTokens, setTopTokens] = useState<string[]>([]);
  const [topProbs, setTopProbs] = useState<number[]>([]);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  // Tokenize the input
  useEffect(() => {
    const tokenize = async () => {
      try {
        const tokenData = await postTokenizeText(initialPrompt, selectedLM);
        setTokens(tokenData.map((t) => t.value));
      } catch (error) {
        console.error("Error tokenizing:", error);
      }
    };

    if (initialPrompt) {
      tokenize();
    }
  }, [initialPrompt, selectedLM]);

  // Get token probabilities for the next token
  useEffect(() => {
    const fetchProbs = async () => {
      if (step >= 3 && tokens.length > 0) {
        try {
          const data = await getTokenProbabilities(initialPrompt, selectedLM);
          setTopTokens(data.tokens);
          setTopProbs(data.probabilities);
          if (data.tokens.length > 0) {
            setSelectedToken(data.tokens[0]); // Select highest probability token
          }
        } catch (error) {
          console.error("Error fetching probabilities:", error);
        }
      }
    };

    fetchProbs();
  }, [step, initialPrompt, selectedLM, tokens]);

  // Auto-advance through steps
  useEffect(() => {
    if (!isPlaying || step >= 5) return;

    const timer = setTimeout(() => {
      setStep((s) => s + 1);
    }, 2000); // 2 seconds per step

    return () => clearTimeout(timer);
  }, [isPlaying, step]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setStep(0);
    setIsPlaying(false);
    setSelectedToken(null);
  };

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-4 flex gap-2">
        <Button onClick={handlePlayPause} size="sm">
          {isPlaying ? (
            <>
              <PauseIcon className="w-4 h-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4 mr-2" />
              Play
            </>
          )}
        </Button>
        <Button onClick={handleReset} size="sm" variant="outline">
          <RotateCcwIcon className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          Step {step} / 5
        </div>
      </div>

      {/* Animation Container */}
      <div className="relative w-full min-h-[600px] border-2 border-gray-200 rounded-lg p-8 bg-gray-50">
        <Arrows step={step} />

        {/* Layout Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Row 1 */}
          <div className="col-span-1">
            <Prompt text={initialPrompt} isVisible={step >= 0} />
          </div>
          <div className="col-span-1">
            <TokensList tokens={tokens} isVisible={step >= 1} />
          </div>
          <div className="col-span-1">
            <Model
              isProcessing={step === 2}
              isVisible={step >= 2}
              modelName={selectedLM}
            />
          </div>

          {/* Row 2 */}
          <div className="col-span-1">
            <LogitsProb
              tokens={topTokens}
              probabilities={topProbs}
              isVisible={step >= 3}
            />
          </div>
          <div className="col-span-1">
            <Sampling
              selectedToken={selectedToken}
              isVisible={step >= 4}
              method="greedy"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm font-semibold text-blue-900 mb-2">
          {step === 0 && "Step 1: Input Prompt"}
          {step === 1 && "Step 2: Tokenization"}
          {step === 2 && "Step 3: Model Processing"}
          {step === 3 && "Step 4: Probability Distribution"}
          {step === 4 && "Step 5: Token Sampling"}
          {step >= 5 && "Complete!"}
        </div>
        <div className="text-xs text-blue-700">
          {step === 0 &&
            "The process begins with a text prompt provided by the user."}
          {step === 1 &&
            "The prompt is broken down into tokens that the model can process."}
          {step === 2 &&
            "The language model processes the tokens through its neural network."}
          {step === 3 &&
            "The model outputs probabilities for potential next tokens."}
          {step === 4 &&
            "A sampling strategy selects the next token based on probabilities."}
          {step >= 5 &&
            "The selected token is added to the output, and the process can repeat for longer generations."}
        </div>
      </div>
    </div>
  );
};
