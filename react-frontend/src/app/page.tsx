// react-frontend/src/app/page.tsx
"use client";

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