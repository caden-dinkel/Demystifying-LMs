//This file handles text generation functionality
"use client";
import { useState } from "react";
import { getGeneratedText } from "@/api/getGeneratedText";
import styles from "@/app/page.module.css";

export const TextGenerator = () => {
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
    <div>
      <p>
        Enter the start of a story or sentence to generate a completion to the
        text.
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
    </div>
  );
};
