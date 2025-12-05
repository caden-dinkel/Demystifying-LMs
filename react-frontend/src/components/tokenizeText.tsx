"use client";
import { useState } from "react";
import { Token } from "@/utilities/types";
import { postTokenizeText } from "@/api/postTokenizeText";
import styles from "@/styles/page.module.css";
import { LMTextarea, ExamplePromptButton } from "./lmTextarea";

export const Tokenizer = () => {
  const [tokenizedOutput, setTokenizedOutput] = useState<Token[]>();

  const handleTokenize = async (prompt: string, modelName: string) => {
    if (!prompt) {
      alert("Please enter a prompt!");
      return;
    }
    try {
      const data = await postTokenizeText(prompt, modelName);
      console.log(data);
      setTokenizedOutput(data);
    } catch (error) {
      console.error("Error Tokenizing Text:", error);
    }
  };

  return (
    <div className={styles.section}>
      <h2>2. Visual Tokenizer</h2>
      <p>Enter any text to see how the model breaks it down into tokens.</p>

      <LMTextarea
        onSend={handleTokenize}
        placeholder="Once upon a time..."
        exampleButton={
          <ExamplePromptButton
            setInputValue={(_) => {}}
            disabled={false}
            exampleText="Once upon a time"
          />
        }
      />

      {tokenizedOutput && (
        <div className={styles.tokenizerOutput}>
          {tokenizedOutput.map((token) => (
            <span key={token.id} className={styles.token}>
              {token.value.replace(/\u0120/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
