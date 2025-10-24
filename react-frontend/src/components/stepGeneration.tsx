"use client";

import { Button } from "./button";
import { SearchTree } from "./searchTree";
import { TextareaInput } from "./textBox";
import React, { useState, useCallback } from "react";
import styles from "@/styles/textbox.module.css";
import but from "@/styles/button.module.css";

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
    <div className={styles.container}>
      <TextareaInput onTextChange={setInputText} value={inputText} />
      <Button
        className={but.btnPrimary}
        onClick={handleStartSearch}
        disabled={
          inputText.trim() === "" ||
          (isTreeReady && submittedPrompt === inputText.trim())
        }
      >
        {isTreeReady ? "Restart Search Tree" : "Start Search Tree"}
      </Button>
      {isTreeReady && <SearchTree initialPrompt={submittedPrompt} />}
    </div>
  );
};
