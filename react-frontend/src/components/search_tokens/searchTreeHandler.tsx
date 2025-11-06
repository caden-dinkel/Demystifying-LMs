// Not used, reference

// ... (imports remain, except for the removed visual components)
import React, { useRef, useState } from "react";
import { D3TokenSearchTree } from "./searchTreeD3"; // New import
import { TreeNode } from "@/utilities/types";
// ...

export interface TokenSearchProps {
  initialPrompt: string;
}

export const TokenSearch = ({ initialPrompt }: TokenSearchProps) => {
  // ... (All existing state and handler logic remains)
  const nextIdRef = useRef(0);
  const getNextId = (): string => {
    const newId = nextIdRef.current.toString();
    nextIdRef.current += 1;
    return newId;
  };

  const [searchTree, setSearchTree] = useState<Map<string, TreeNode>>(() => {
    if (!initialPrompt) return new Map();
    const rootNode: TreeNode = {
      id: "initial",
      token: initialPrompt,
      prob: 1,
      parentNodeId: null,
      childrenNodeIds: [],
      isSelected: true,
    };
    return new Map([[rootNode.id, rootNode]]);
  });

  const [searchPath, setSearchPath] = useState<string[]>(() => {
    return initialPrompt ? ["initial"] : [];
  });
  // Remove handleLHSTokenRender, handleRHSTokenRender, and connectorsData memo
  // These are now handled internally by D3

  /* ... (Existing logic for searchTree, searchPath, handleNextToken, handlePrevNode) ... */

  return (
    <div className={styles.animationContainer} ref={containerRef}>
      <D3TokenSearchTree
        searchTree={searchTree}
        searchPath={searchPath}
        onNodeClick={handlePrevNode} // D3 handles the click and calls this React function
      />
    </div>
  );
};
