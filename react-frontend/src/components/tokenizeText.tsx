import { useState } from "react";
import { Token } from "@/api/types";
import { postTokenizeText } from "@/api/postTokenizeText";
import styles from "@/app/page.module.css";
import { Button } from "./button";

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
    <div className={styles.section}>
      <h2>2. Visual Tokenizer</h2>
      <p>
        Enter any text to see how the GPT-2 model breaks it down into tokens.
      </p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Once upon a time..."
        rows={4}
        className={styles.textarea}
      />

      <Button onClick={handleTokenize} className={styles.button} />
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
