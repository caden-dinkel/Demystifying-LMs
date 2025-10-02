// Add this line at the very top. It tells Next.js to run this code in the browser.
"use client";

import { Button } from "../components/button";
import React, { useState } from "react";
import styles from "./page.module.css"; // We'll use this for styling

import { TokenProb } from "@/api/types";
import { getTokenProbabilities } from "@/api/getTokenProbs";
import { getGeneratedText } from "@/api/getGeneratedText";
import { SearchTree } from "@/components/searchTree";

export default function Home() {
  // State to hold the user's input prompt
  // State to hold the generated text from the model

  const [tokensProbs, setTokensProbs] = useState<TokenProb | null>(null);
  // State to track if the model is currently generating a response

  const handleNextToken = async () => {
    if (!prompt) {
      alert("Please enter a prompt!");
      return;
    }
    try {
      const data = await getTokenProbabilities(prompt);
      console.log(data);
      setTokensProbs(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const [prompt, setPrompt] = useState("");

  const [result, setResult] = useState(
    "The model's output will appear here..."
  );

  const [readyForTree, setReadyForTree] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  //Handles calls to generate_text
  const handleGenerate = async () => {
    if (!prompt) {
      alert("Please enter a prompt!");
      return;
    }

    setIsLoading(true);
    setResult("Generating...");

    try {
      // The API call to your Python backend remains the same
      const data = await getGeneratedText(prompt);

      setResult(data.prompt);
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
    <main className={styles.main}>
      <div className={styles.container}>
        <h1>Demystifying Language Models</h1>
        <p>
          Enter the start of a story or sentence to generate a completion to the
          text. next.
        </p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Once upon a time..."
          rows={4}
          className={styles.textarea}
        />

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className={styles.button}
        >
          {isLoading ? "Generating..." : "Generate Text"}
        </button>

        <h3>Generated Output:</h3>
        <div className={styles.resultBox}>{result}</div>

        <div className={styles.container}>
          <button onClick={handleNextToken} className={styles.button}></button>
          <p>
            Data from backend: {tokensProbs?.tokens}{" "}
            {tokensProbs?.probabilities}
          </p>
        </div>
        <div>
          <div>
            <Button variant="default" onClick={() => setReadyForTree(true)}>
              Start Search Tree
            </Button>
            {readyForTree && <SearchTree initialPrompt={prompt} />}
          </div>
        </div>
      </div>
    </main>
  );
}
