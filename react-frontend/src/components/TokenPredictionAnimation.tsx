"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import { getTokenProbabilities } from "@/api/getTokenProbs";
import { Loader2 } from "lucide-react";
import styles from "@/styles/token-prediction.module.css";

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
    <Card className={styles.container}>
      <CardHeader>
        <CardTitle>Live Token Prediction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className={styles.labelText}>
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
          <div className={styles.loadingContainer}>
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className={styles.loadingText}>
              Calculating predictions...
            </span>
          </div>
        )}

        {error && <div className={styles.errorText}>{error}</div>}

        {!isLoading && !error && predictions.length > 0 && (
          <div className="space-y-3">
            <h3 className={styles.predictionsTitle}>
              Most Likely Next Tokens:
            </h3>
            <div className={styles.predictionsList}>
              {predictions.map((pred, idx) => (
                <div
                  key={`${pred.token_id}-${idx}`}
                  className={styles.predictionItem}
                  style={{
                    animationDelay: `${idx * 0.05}s`,
                  }}
                >
                  <div className={styles.rankBadge}>{idx + 1}</div>
                  <div className={styles.predictionContent}>
                    <div className={styles.predictionHeader}>
                      <span className={styles.tokenText}>
                        "{pred.token.replace(/Ġ/g, " ").replace(/\u0120/g, " ")}
                        "
                      </span>
                      <span className={styles.probabilityText}>
                        {(pred.probability * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className={styles.progressBarBackground}>
                      <div
                        className={styles.progressBarFill}
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
            <div className={styles.emptyState}>No predictions available</div>
          )}
      </CardContent>
    </Card>
  );
};
