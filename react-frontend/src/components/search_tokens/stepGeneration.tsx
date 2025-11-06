"use client";

import { Button } from "../button";
import { TextareaInput } from "../textBox";
import React, { useState, useCallback } from "react";
import { TokenSearch } from "./userSearchTree";

export const StepTokenGen = () => {
  const [inputText, setInputText] = useState("");

  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);

  const handleStartSearch = useCallback(() => {
    if (inputText.trim() === "") {
      alert("Please enter some text to begin the search tree.");
      return;
    }

    // Update the submitted prompt state, triggering the SearchTree to render
    setSubmittedPrompt(inputText.trim());
  }, [inputText]);

  // Use a boolean for cleaner JSX condition
  const isTreeReady = submittedPrompt !== null;

  return (
    <div>
      <TextareaInput onTextChange={setInputText} value={inputText} />
      <Button
        onClick={handleStartSearch}
        disabled={
          inputText.trim() === "" ||
          (isTreeReady && submittedPrompt === inputText.trim())
        }
      >
        {isTreeReady ? "Restart Search Tree" : "Start Search Tree"}
      </Button>
      {isTreeReady && <TokenSearch initialPrompt={submittedPrompt} />}
    </div>
  );
};
