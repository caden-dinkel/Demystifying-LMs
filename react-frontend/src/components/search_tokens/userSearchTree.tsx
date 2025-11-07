//tokenSearching.tsx
import styles from "@/styles/tokens.module.css";
import React from "react";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { TreeNode, TokenData } from "@/utilities/types";
import { getTokenProbabilities } from "@/api/getTokenProbs";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import { PromptDisplay } from "./promptDisplay";
import { SearchTreeConnector } from "./treeBranches";
import { TokenMap } from "./tokenMap";
export interface TokenSearchProps {
  initialPrompt: string;
}

export const TokenSearch = ({ initialPrompt }: TokenSearchProps) => {
  // Keys for treenodes
  const nextIdRef = useRef(0);
  const getNextId = (): string => {
    const newId = nextIdRef.current.toString();
    nextIdRef.current += 1;
    return newId;
  };

  const { modelName } = useLMSettings();
  // --- State Initialization (SSoT) ---
  // Data to know values of lhs and rhs tokens
  // Key of each node refers to id of last lhs token
  const [searchTree, setSearchTree] = useState<Map<string, TreeNode>>(
    new Map()
  );

  const [animationData, setAnimationData] = useState<{
    startCoords: DOMRect;
    endId: string;
  } | null>(null);

  // Stores current string of tokens that form the search path.
  const [searchPath, setSearchPath] = useState<string[]>([]);

  const [lhsRect, setLhsRect] = useState<DOMRect | null>(null);
  const [rhsRects, setRhsRects] = useState<DOMRect[]>([]);

  // Reset state when initialPrompt changes
  useEffect(() => {
    if (!initialPrompt) {
      setSearchTree(new Map());
      setSearchPath([]);
      setAnimationData(null);
      setLhsRect(null);
      setRhsRects([]);
      nextIdRef.current = 0; // Reset ID counter
      return;
    }

    const rootNode: TreeNode = {
      id: "initial",
      token: initialPrompt,
      prob: 1,
      parentNodeId: null,
      childrenNodeIds: [],
      isSelected: true,
    };
    setSearchTree(new Map([[rootNode.id, rootNode]]));
    setSearchPath(["initial"]);
    setAnimationData(null);
    setLhsRect(null);
    setRhsRects([]);
    nextIdRef.current = 0; // Reset ID counter

    // Fetch children for the root node
    const fetchInitialChildren = async () => {
      try {
        const data = await getTokenProbabilities(initialPrompt, modelName);
        const normalizedProbs = normalizeProbabilities(data.probabilities);
        setSearchTree((prevTree) => {
          const newTree = new Map(prevTree);
          const rootNode = newTree.get("initial");
          if (!rootNode) return prevTree;

          const newChildrenIds = data.tokens.map(() => getNextId());

          // 1. Update Root Node with Children IDs
          newTree.set("initial", {
            ...rootNode,
            childrenNodeIds: newChildrenIds,
          });

          // 2. Add New Child Nodes
          data.tokens.forEach((token, index) => {
            newTree.set(newChildrenIds[index], {
              id: newChildrenIds[index],
              token: token,
              prob: normalizedProbs[index],
              parentNodeId: "initial",
              childrenNodeIds: [],
              isSelected: false,
            });
          });
          return newTree;
        });
      } catch (error) {
        console.error("Error fetching initial tokens:", error);
      }
    };

    fetchInitialChildren();
  }, [initialPrompt, modelName]);
  const containerRef = useRef<HTMLDivElement>(null);

  const parentRect = containerRef.current?.getBoundingClientRect() ?? null;

  // Helper function to normalize token probabilities
  const normalizeProbabilities = (probabilities: number[]): number[] => {
    const sum = probabilities.reduce((acc, prob) => acc + prob, 0);
    if (sum === 0) return probabilities.map(() => 0);
    return probabilities.map((prob) => prob / sum);
  };

  // Handler for clicking a token on the rhs.
  const handleNextToken = async (selectedId: string, startCoords: DOMRect) => {
    const currentPathEndId = searchPath[searchPath.length - 1];
    setAnimationData({ startCoords, endId: selectedId });
    // Get prompt (using current path end ID for prompt construction)
    const promptTokens = searchPath
      .map((id) => searchTree.get(id)?.token)
      .filter((t): t is string => t !== undefined)
      .join("");
    const selectedToken = searchTree.get(selectedId)?.token ?? "";
    const promptForApi = promptTokens + selectedToken;

    // Fetch New Tokens and update all state atomically
    try {
      const data = await getTokenProbabilities(promptForApi, modelName);
      const normalizedProbs = normalizeProbabilities(data.probabilities);
      const newChildrenIds = data.tokens.map(() => getNextId());

      console.log("Fetched Data for Prompt:", promptForApi);

      setSearchTree((prevTree) => {
        const newTree = new Map(prevTree);

        // 1. Deselect previous node
        const prevNode = newTree.get(currentPathEndId);
        if (prevNode)
          newTree.set(currentPathEndId, { ...prevNode, isSelected: false });

        // 2. Select new node and set its children
        const newNode = newTree.get(selectedId);
        if (newNode) {
          newTree.set(selectedId, {
            ...newNode,
            isSelected: true,
            childrenNodeIds: newChildrenIds,
          });
        }

        // 3. Add the new child nodes
        data.tokens.forEach((token, index) => {
          newTree.set(newChildrenIds[index], {
            id: newChildrenIds[index],
            token: token,
            prob: normalizedProbs[index],
            parentNodeId: selectedId,
            childrenNodeIds: [],
            isSelected: false,
          });
        });

        return newTree;
      });

      // Update path after tree is updated (for consistency)
      setSearchPath((prevPath) => [...prevPath, selectedId]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handlePrevNode = useCallback(
    (selectedNodeID: string) => {
      setSearchPath((prevPath) => {
        const selectedIndex = prevPath.findIndex((id) => id === selectedNodeID);
        if (selectedIndex !== -1) {
          const newPath = prevPath.slice(0, selectedIndex + 1);

          // Update the isSelected flags for visual consistency
          setSearchTree((prevTree) => {
            const newTree = new Map(prevTree);

            // Deselect nodes that were truncated from the path
            prevPath.slice(selectedIndex + 1).forEach((idToDeselect) => {
              const node = newTree.get(idToDeselect);
              if (node)
                newTree.set(idToDeselect, { ...node, isSelected: false });
            });

            // Select the new end of the path
            const newEndNode = newTree.get(selectedNodeID);
            if (newEndNode)
              newTree.set(selectedNodeID, { ...newEndNode, isSelected: true });

            return newTree;
          });

          return newPath;
        }
        return prevPath;
      });
    },
    [setSearchTree]
  );

  // Handle rendering of TokenChips
  const handleLHSTokenRender = useCallback((rect: DOMRect) => {
    setLhsRect(rect);
  }, []);

  const handleRHSTokenRender = useCallback((rects: DOMRect[]) => {
    setRhsRects(rects);
  }, []);

  // --- Derived State (Calculated in Render) ---

  // Data to know where to draw svg paths
  const connectorsData = useMemo(() => {
    if (!lhsRect || !rhsRects.length) return null;

    return {
      lhsBox: lhsRect,
      rhsBoxes: rhsRects,
    };
  }, [lhsRect, rhsRects]);

  const lastId = searchPath[searchPath.length - 1];

  // Tokens for the LHS (PromptDisplay)
  const lhsTokenData: TokenData[] =
    searchPath
      .map((id) => searchTree.get(id))
      .filter((node): node is TreeNode => node !== undefined)
      .map((node) => ({ id: node.id, token: node.token, prob: node.prob })) ??
    [];

  // Tokens for the RHS (TokenMap)
  const rhsTokenData: TokenData[] =
    searchTree
      .get(lastId)
      ?.childrenNodeIds // Get the IDs of the current node's children
      .map((id) => searchTree.get(id))
      .filter((node): node is TreeNode => node !== undefined)
      .map((node) => ({ id: node.id, token: node.token, prob: node.prob })) ??
    [];

  return (
    <div className={styles.animationContainer} ref={containerRef}>
      <div className={styles.contentContainer}>
        <div className={styles.lhsContainer}>
          {rhsRects.length > 0 && (
            <PromptDisplay
              currentTokens={lhsTokenData}
              onNodeClick={handlePrevNode}
              onContainerRender={handleLHSTokenRender}
            ></PromptDisplay>
          )}
        </div>
        <div className={styles.rhsContainer}>
          <div className={styles.tokenMapContainer}>
            <TokenMap
              tokenData={rhsTokenData}
              onSelection={handleNextToken}
              onRender={handleRHSTokenRender}
            ></TokenMap>
          </div>
        </div>
      </div>
      {connectorsData !== null && (
        <SearchTreeConnector
          lhsBox={connectorsData.lhsBox}
          rhsBoxes={connectorsData.rhsBoxes}
          parentRect={parentRect}
        ></SearchTreeConnector>
      )}
    </div>
  );
};
