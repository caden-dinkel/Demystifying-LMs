"use client";
import React from "react";

import { useState } from "react";
import { Token } from "@/utilities/types";
import { postTokenizeText } from "@/api/postTokenizeText";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LMTextarea, ExamplePromptButton } from "./lmTextarea";
import { cn } from "@/lib/utils";

export const Tokenizer = () => {
  const [tokenizedOutput, setTokenizedOutput] = useState<Token[]>();
  const [prompt, setPrompt] = useState("");
  const handleTokenize = async () => {
    if (!prompt) {
      alert("Please enter a prompt!");
      return;
    }
    try {
      const data = await postTokenizeText(prompt);
      console.log(data);
      setTokenizedOutput(data);
    } catch (error) {
      console.error("Error Tokenizing Text:", error);
    }
  };
  return (
    <div>
      <TextareaInput value={prompt} onTextChange={(e) => setPrompt(e)} />

    const handleTokenize = async (input: string) => {
        if (!input) {
            alert("Please enter a prompt!");
            return;
        }
        setPrompt(input);
        try {
            const data = await postTokenizeText(input, selectedLM);
            setTokenizedOutput(data);
        } catch (error) {
            console.error("Error Tokenizing Text:", error);
            throw error; // Re-throw to let LMTextarea handle loading state
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">2. Visual Tokenizer</h2>
            <p className="text-muted-foreground">
                Enter any text to see how the model breaks it down into tokens.
            </p>
            <LMTextarea
                onSend={handleTokenize}
                placeholder="Enter text to tokenize..."
                exampleButton={
                    <ExamplePromptButton
                        setInputValue={(_) => { }}
                        disabled={false}
                        exampleText={"The fat cat sat on the mat."}
                    />
                }
            />
            {tokenizedOutput && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-1">
                            {tokenizedOutput.map((token) => (
                                <span
                                    key={token.id}
                                    className={cn(
                                        "inline-block px-2 py-1 rounded-md text-sm",
                                        "bg-secondary text-secondary-foreground",
                                        "border border-border"
                                    )}
                                >
                                    {token.value.replace(/\u0120/g, " ")}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
