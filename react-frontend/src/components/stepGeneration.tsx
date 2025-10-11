"use client";
import { Button } from "./button";
import { SearchTree } from "./searchTree";
import { TextareaInput } from "./textBox";
import React, { useState, useCallback } from "react";
import styles from "@/styles/textbox.module.css";
// Assuming SearchTree, Button, and styles are imported correctly

export const StepTokenGen = () => {
  // 1. State for the *live* text area input
  const [inputText, setInputText] = useState("");

  // 2. State for the *submitted* text to be passed to the SearchTree
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);

  // Function to handle the button click
  const handleStartSearch = useCallback(() => {
    // Basic validation
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
    <div className={styles.container}>
      {/* Textarea remains a standard controlled component */}
      <TextareaInput onTextChange={setInputText} value={inputText} />
      <Button
        variant="default"
        onClick={handleStartSearch}
        // Button is disabled if the input is empty or the tree is already displayed
        // using the *current* input text (optional, but good UX)
        disabled={
          inputText.trim() === "" ||
          (isTreeReady && submittedPrompt === inputText.trim())
        }
      >
        {isTreeReady ? "Restart Search Tree" : "Start Search Tree"}
      </Button>

      {/* 3. Render SearchTree using the submittedPrompt */}
      {isTreeReady && <SearchTree initialPrompt={submittedPrompt} />}
    </div>
  );
};
