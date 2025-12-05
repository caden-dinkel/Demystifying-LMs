"use client";

import { LMTextarea } from "../lmTextarea";
import React, { useState, useCallback } from "react";
import { UserSearchTreeD3 } from "./userSearchTreeD3";

export const StepTokenGen = () => {
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);

  const handleStartSearch = useCallback((input: string, mode: string) => {
    if (input.trim() === "") {
      alert("Please enter some text to begin the search tree.");
      return;
    }

    // Update the submitted prompt state, triggering the SearchTree to render
    setSubmittedPrompt(input.trim());
  }, []);

  // Use a boolean for cleaner JSX condition
  const isTreeReady = submittedPrompt !== null;

  return (
    <div>
      <LMTextarea
        onSend={handleStartSearch}
        placeholder="Enter prompt to start search tree..."
      />
      {isTreeReady && <UserSearchTreeD3 initialPrompt={submittedPrompt} />}
    </div>
  );
};
