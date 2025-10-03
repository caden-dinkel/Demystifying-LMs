// react-frontend/src/app/page.tsx
"use client";

import { Button } from "../components/button";
import React, { useState } from "react";
import styles from "./page.module.css";

// --- TypeScript Interfaces ---

// Shape of the data to use for rendering
interface NextTokenProbability {
    token: string;
    probability: number;
}

// Shape of the raw data from the /generate_prob API endpoint
interface ApiProbResponse {
    probabilities: number[];
    tokens: string[];
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

interface Token {
    id: number;
    text: string;
}

export default function Home() {
    // --- State for Full Text Generation ---
    const [prompt, setPrompt] = useState<string>("Once upon a time");
    const [fullResult, setFullResult] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // --- State for the Visual Tokenizer ---
    const [textToTokenize, setTextToTokenize] = useState<string>("Hello world!");
    const [tokenizedOutput, setTokenizedOutput] = useState<Token[]>([]);
    const [isTokenizing, setIsTokenizing] = useState<boolean>(false);

    // --- State for Step-by-Step Generation ---
    const [steppedPrompt, setSteppedPrompt] = useState<string>("The quick brown fox");
    // This state will now hold our formatted, combined data
    const [nextTokenProbs, setNextTokenProbs] = useState<NextTokenProbability[]>([]);
    const [isStepping, setIsStepping] = useState<boolean>(false);


    // --- API Handler for Full Generation ---
    const handleGenerate = async () => {
        setIsGenerating(true);
        setFullResult("Generating...");
        try {
            const response = await fetch("http://127.0.0.1:5000/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompt }),
            });
            if (!response.ok) throw new Error("Network response was not ok.");
            const data = await response.json();
            setFullResult(data.generated_text);
        } catch (error) {
            console.error("Error generating text:", error);
            setFullResult("Error: Could not get a response from the server.");
        } finally {
            setIsGenerating(false);
        }
    };

    // --- API Handler for Tokenizer ---
    const handleTokenize = async () => {
        setIsTokenizing(true);
        try {
            const response = await fetch("http://127.0.0.1:5000/api/tokenize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textToTokenize }),
            });
            if (!response.ok) throw new Error("Network response was not ok.");
            const data = await response.json();
            setTokenizedOutput(data);
        } catch (error) {
            console.error("Error tokenizing text:", error);
        } finally {
            setIsTokenizing(false);
        }
    };

    // --- API Handler for Next Token Generation ---
    const handleNextToken = async () => {
        setIsStepping(true);
        try {
            const response = await fetch("http://127.0.0.1:5000/generate_prob", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: steppedPrompt }),
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data: ApiProbResponse = await response.json();

            const formattedData = data.tokens.map((token, index) => ({
                token: token,
                probability: data.probabilities[index]
            }));

            setNextTokenProbs(formattedData);

            // Automatically append the most likely token to the prompt
            if (formattedData.length > 0) {
                const topToken = formattedData[0].token;
                setSteppedPrompt(prev => prev + topToken);
            }
        } catch (error) {
            console.error("Error fetching next token:", error);
        } finally {
            setIsStepping(false);
        }
    };


    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <h1>Demystifying Language Models</h1>

                {/* Section 1: Full Text Generation */}
                <div className={styles.section}>
                    <h2>1. Full Text Generation</h2>
                    <p>Provide a prompt and the model will generate a complete text sequence.</p>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        className={styles.textarea}
                    />
                    <button onClick={handleGenerate} disabled={isGenerating} className={styles.button}>
                        {isGenerating ? "Generating..." : "Generate Text"}
                    </button>
                    {fullResult && <div className={styles.resultBox}>{fullResult}</div>}
                </div>

                {/* Section 2: Visual Tokenizer */}
                <div className={styles.section}>
                    <h2>2. Visual Tokenizer</h2>
                    <p>Enter any text to see how the GPT-2 model breaks it down into tokens.</p>
                    <textarea
                        value={textToTokenize}
                        onChange={(e) => setTextToTokenize(e.target.value)}
                        rows={2}
                        className={styles.textarea}
                    />
                    <button onClick={handleTokenize} disabled={isTokenizing} className={styles.button}>
                        {isTokenizing ? "Tokenizing..." : "Tokenize"}
                    </button>
                    {tokenizedOutput.length > 0 && (
                        <div className={styles.tokenizerOutput}>
                            {tokenizedOutput.map((token) => (
                                <span key={token.id} className={styles.token}>
                                    {token.text.replace(/\u0120/g, " ")}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Section 3: Step-by-Step Generation */}
                <div className={styles.section}>
                    <h2>3. Step-by-Step Generation</h2>
                    <p>See the models prediction for the very next token. Click Next Step to add the top prediction and see the next set of probabilities.</p>
                    <div className={styles.resultBox}>{steppedPrompt}</div>
                    <button onClick={handleNextToken} disabled={isStepping} className={styles.button}>
                        {isStepping ? "Thinking..." : "Next Step"}
                    </button>
                    {nextTokenProbs.length > 0 && (
                        <div className={styles.probabilities}>
                            <h3>Top 5 Next Token Probabilities:</h3>
                            <ul>
                                {nextTokenProbs.slice(0, 5).map((p, index) => (
                                    <li key={index}>
                                        <span className={styles.tokenPrediction}>
                                            {p.token.replace(/\u0120/g, " ")}
                                        </span>
                                        <span className={styles.probability}>
                                            ({(p.probability * 100).toFixed(2)}%)
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}