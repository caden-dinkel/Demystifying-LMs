"use client";

import { useState } from "react";
import { Token } from "@/lib/types";
import { postTokenizeText } from "@/api/postTokenizeText";
import button from "@/styles/button.module.css";
import toks from "@/styles/tokens.module.css";
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
      <TextareaInput value={prompt} onTextChange={(e) => setPrompt(e)} />

      <Button onClick={handleTokenize} className={button.btnPrimary}>
        Tokenize Text
      </Button>
      {tokenizedOutput && (
        <div className={toks.tokenizerOutput}>
          {tokenizedOutput.map((token) => (
            <span key={token.id} className={toks.token}>
              {token.value.replace(/\u0120/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
