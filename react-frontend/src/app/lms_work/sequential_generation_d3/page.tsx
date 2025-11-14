"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/navigation/navBar";
import { LMTextarea } from "@/components/lmTextarea";
import { UserSearchTreeD3 } from "@/components/search_tokens/userSearchTreeD3";

export default function SequentialGenerationD3() {
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
        {showTree && <UserSearchTreeD3 key={prompt} initialPrompt={prompt} />}
      </div>
    </div>
  );
}
