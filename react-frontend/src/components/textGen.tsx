//This file handles text generation functionality
"use client";
import { useState } from "react";
import { getGeneratedText } from "@/api/getGeneratedText";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const TextGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(
    "The model's output will appear here..."
  );
  const [isLoading, setIsLoading] = useState(false);
  const { selectedLM } = useLMSettings();

  const handleGenerate = async () => {
    if (!prompt) {
      alert("Please enter a prompt!");
      return;
    }

    setIsLoading(true);
    setResult("Generating...");

    try {
      // The API call to your Python backend remains the same
      const data = await getGeneratedText(prompt, selectedLM);

      setResult(data.token);
    } catch (error) {
      console.error("Error fetching data:", error);
      setResult(
        "Error: Could not get a response from the server. Is it running?"
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Enter the start of a story or sentence to generate a completion to the
        text.
      </p>
      <Button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Text"}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Generated Output:</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{result}</p>
        </CardContent>
      </Card>
    </div>
  );
};
