import { useState } from "react";
import { Token } from "@/lib/types";
import { postTokenizeText } from "@/api/postTokenizeText";
import styles from "@/styles/page.module.css";
import { Button } from "./button";
import { TextareaInput } from "./textBox";

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
      <h2>2. Visual Tokenizer</h2>
      <p>
        Enter any text to see how the GPT-2 model breaks it down into tokens.
      </p>
      <TextareaInput value={prompt} onTextChange={(e) => setPrompt(e)} />

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
