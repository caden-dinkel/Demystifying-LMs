"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import { getTokenProbabilities } from "@/api/getTokenProbs";
import { Loader2 } from "lucide-react";

interface TokenPrediction {
  token: string;
  probability: number;
  token_id: number;
}

export const TokenPredictionAnimation: React.FC = () => {
  const { selectedLM } = useLMSettings();
  const [inputText, setInputText] = useState("The cat");
  const [predictions, setPredictions] = useState<TokenPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced fetch function
  const fetchPredictions = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setPredictions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await getTokenProbabilities(text, selectedLM);
        const topPredictions: TokenPrediction[] = data.tokens
          .slice(0, 5)
          .map((token, idx) => ({
            token: token,
            probability: data.probabilities[idx],
            token_id: data.token_ids[idx],
          }));

        setPredictions(topPredictions);
      } catch (err) {
        console.error("Error fetching predictions:", err);
        setError("Failed to fetch predictions");
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedLM]
  );

  // Debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPredictions(inputText);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [inputText, fetchPredictions]);

  return (
    <Card className="w-full max-w-4xl mx-auto my-6">
      <CardHeader>
        <CardTitle>Live Token Prediction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enter text to see next token predictions:
          </label>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Start typing..."
            className="text-lg"
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-600">
              Calculating predictions...
            </span>
          </div>
        )}

        {error && <div className="text-red-500 text-sm py-2">{error}</div>}

        {!isLoading && !error && predictions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Most Likely Next Tokens:
            </h3>
            <div className="space-y-2">
              {predictions.map((pred, idx) => (
                <div
                  key={`${pred.token_id}-${idx}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 transition-all duration-300 hover:shadow-md"
                  style={{
                    animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both`,
                  }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-lg font-semibold text-gray-800 dark:text-gray-200">
                        "{pred.token.replace(/Ġ/g, " ").replace(/\u0120/g, " ")}
                        "
                      </span>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {(pred.probability * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{
                          width: `${pred.probability * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading &&
          !error &&
          predictions.length === 0 &&
          inputText.trim() && (
            <div className="text-center py-8 text-gray-500">
              No predictions available
            </div>
          )}

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
};
