import { useState } from "react";
import { Button } from "./button";
import { SearchTree } from "./searchTree";
import styles from "@/app/page.module.css";

export const StepTokenGen = () => {
  const [prompt, setPrompt] = useState("");
  const [readyForTree, setReadyForTree] = useState(false);

  return (
    <div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Once upon a time..."
        rows={4}
        className={styles.textarea}
      />
      <Button variant="default" onClick={() => setReadyForTree(true)}>
        Start Search Tree
      </Button>
      {readyForTree && <SearchTree initialPrompt={prompt} />}
    </div>
  );
};
