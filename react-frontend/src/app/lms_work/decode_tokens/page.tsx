"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/navigation/navBar";
import { LMTextarea, ExamplePromptButton } from "@/components/lmTextarea";
import { TokenSearch } from "@/components/search_tokens/userSearchTree";
import { Button } from "@/components/ui/button";
import { PageNavigation } from "@/components/navigation/PageNavigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  PlayIcon,
  PauseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import styles from "@/styles/main-layout.module.css";

const searchingTokensContent = `# Searching Tokens

So, the model can predict the probability of the next token. But a full response is a long chain of tokens. How does it decide which chain is best?

This is where search algorithms come in. For example if the model always picked the most probable token at every step, a greedy search, it would probably get stuck in a weird loop or itself into a corner. A strong example of this is actually something you use everyday. Your phone's auto complete is great at picking the next work, but it can't write a creative story.

To create genuinely meaningful language, the model needs to use more advanced algorithms to explore many different 'paths' of tokens. These include algorithms like Beam Search, or sampling methods like Top-k and Top-p (Nucleus) sampling. While these methods are much more complex, they provide a much better result. By looking ahead to find a sequence of words that, as a whole, make the most sense resulting in a high quality coherent response.
`;

export default function SearchingForWords() {
  const [prompt, setPrompt] = useState<string>("");
  const [showTree, setShowTree] = useState<boolean>(false);

  const handleStartSearch = useCallback((userPrompt: string) => {
    setPrompt(userPrompt);
    setShowTree(true);
  }, []);

  return (
    <div>
      <Navbar />
          <main className={styles.baseMain}>
        <article className="prose lg:prose-xl dark:prose-invert max-w-7xl mb-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {searchingTokensContent}
          </ReactMarkdown>
        </article>

        <LMTextarea
          onSend={handleStartSearch}
          exampleButton={
            <ExamplePromptButton
              setInputValue={(_) => {}}
              disabled={false}
              exampleText={"The capital of France is"}
            />
          }
        />

        {showTree && (
          <TokenSearch key={`manual-${prompt}`} initialPrompt={prompt} />
        )}
        <PageNavigation
          previousPage={{
            href: "/lms_work/predict_next",
            label: "Predicting Next Token",
          }}
        />
      </main>
    </div>
  );
}
