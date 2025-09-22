// Add this line at the very top. It tells Next.js to run this code in the browser.
"use client";

import React, { useState } from "react";
import styles from "./page.module.css"; // We'll use this for styling

export default function Home() {
  // State to hold the user's input prompt
  // State to hold the generated text from the model

  const [dictResult, setDictResult] = useState({});
  // State to track if the model is currently generating a response

  const handleNextToken = async () => {
    if (!prompt) {
      alert("Please enter a prompt!");
      return;
    }
    try {
      const response = await fetch("http://127.0.0.1:5000/generate_prob", {
        method: "Post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt }),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} statusText: ${response.statusText}`
        );
      }

      const data = await response.json();
      setDictResult(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setDictResult("Could not get data");
    }
  };
  const [prompt, setPrompt] = useState("");

  const [result, setResult] = useState(
    "The model's output will appear here..."
  );

  const [isLoading, setIsLoading] = useState(false);
  const handleGenerate = async () => {
    if (!prompt) {
      alert("Please enter a prompt!");
      return;
    }

    setIsLoading(true);
    setResult("Generating...");

    try {
      // The API call to your Python backend remains the same
      const response = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.generated_text);
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
            Data from backend: {dictResult.probabilities}, {dictResult.tokens}
          </p>
        </div>
      </div>
    </main>
  );
}
