"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/navigation/navBar";
import { LMTextarea } from "@/components/lmTextarea";
import { TokenSearch } from "@/components/search_tokens/userSearchTree";
import { ConnectorLayoutProvider } from "@/components/search_tokens/useConnectorLayout";

export default function SequentialGeneration() {
  const [prompt, setPrompt] = useState<string>("");
  const [showTree, setShowTree] = useState<boolean>(false);

  const handleStartSearch = useCallback((userPrompt: string) => {
    setPrompt(userPrompt);
    setShowTree(true);
  }, []);

  return (
    <div>
      <Navbar />
      <div
        style={{
          marginLeft: "1rem",
          marginTop: "1rem",
          width: "calc(100vw - 2rem)",
        }}
      >
        <LMTextarea onSend={handleStartSearch} />
        {showTree && (
          <ConnectorLayoutProvider>
            <TokenSearch initialPrompt={prompt} />
          </ConnectorLayoutProvider>
        )}
      </div>
    </div>
  );
}
