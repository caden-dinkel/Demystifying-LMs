//tokenSearching.tsx
import styles from "@/styles/tokens.module.css";
import React from "react";
import { useCallback, useState } from "react";
import { getTokenProbabilities } from "@/api/getTokenProbs";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import { SearchTreeProvider, useSearchTree } from "./useSearchTree";
import { PromptDisplay } from "./promptDisplay";
import { SearchTreeConnector } from "./treeBranches";
import { TokenMap } from "./tokenMap";
import { GeneratedTextBox } from "./generatedTextBox";

export interface TokenSearchProps {
  initialPrompt: string;
}

// Inner component that uses the context
const TokenSearchContent = () => {
  const { selectedLM } = useLMSettings();

  const {
    lhsTokenData,
    rhsTokenData,
    searchPath,
    searchTree,
    addChildrenToNode,
    selectNode,
    deselectNode,
    moveToNode,
    navigateBack,
    setAnimationData,
    buildPromptFromPath,
    getNodeById,
  } = useSearchTree();

  const [animatingTokenIndex, setAnimatingTokenIndex] = useState<number | null>(
    null
  );

  // Handler for clicking a token on the rhs (USER-DRIVEN API CALL)
  const handleNextToken = useCallback(
    async (selectedId: string, startCoords: DOMRect) => {
      const currentPathEndId = searchPath[searchPath.length - 1];
      setAnimationData({ startCoords, endId: selectedId });

      // Get the selected token
      const selectedNode = getNodeById(selectedId);
      if (!selectedNode) return;

      // Find the index of the selected token in rhsTokenData
      const tokenIndex = rhsTokenData.findIndex(
        (token) => token.id === selectedId
      );

      // Start animation
      setAnimatingTokenIndex(tokenIndex);

      // Wait for animation delay (500ms)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Stop animation
      setAnimatingTokenIndex(null);

      // Build prompt for API
      const promptForApi = buildPromptFromPath() + selectedNode.token;

      try {
        // USER-SPECIFIC: Make API call based on user selection
        const data = await getTokenProbabilities(promptForApi, selectedLM);

        // Deselect previous node
        deselectNode(currentPathEndId);

        // Select new node
        selectNode(selectedId);

        // Add children to the newly selected node
        addChildrenToNode(
          selectedId,
          data.tokens,
          data.probabilities,
          data.token_ids
        );

        // Update path
        moveToNode(selectedId);
      } catch (error) {
        console.error("Error fetching data:", error);
        setAnimatingTokenIndex(null);
      }
    },
    [
      searchPath,
      selectedLM,
      rhsTokenData,
      setAnimationData,
      buildPromptFromPath,
      getNodeById,
      deselectNode,
      selectNode,
      addChildrenToNode,
      moveToNode,
    ]
  );

  const handlePrevNode = useCallback(
    (selectedNodeID: string) => {
      navigateBack(selectedNodeID);
    },
    [navigateBack]
  );

  return (
    <div className={styles.animationContainer} data-search-tree-container>
      {/* Draggable Generated Text Box */}
      <GeneratedTextBox text={buildPromptFromPath()} />

      <div className={styles.contentContainer}>
        <div className={styles.lhsContainer}>
          {rhsTokenData.length > 0 && (
            <PromptDisplay
              currentTokens={lhsTokenData}
              onNodeClick={handlePrevNode}
            />
          )}
        </div>
        <div className={styles.rhsContainer}>
          <div id="search-tree-tokens" className={styles.tokenMapContainer}>
            <TokenMap tokenData={rhsTokenData} onSelection={handleNextToken} />
          </div>
        </div>
      </div>
      {rhsTokenData.length > 0 && (
        <SearchTreeConnector animatingTokenIndex={animatingTokenIndex} />
      )}
    </div>
  );
};

// Wrapper component that provides the context
export const TokenSearch = ({ initialPrompt }: TokenSearchProps) => {
  const { selectedLM } = useLMSettings();

  // Handler for initial API call when tree is initialized
  const handleInitialize = useCallback(
    async (
      prompt: string,
      addChildren: (tokens: string[], probabilities: number[]) => void
    ) => {
      try {
        const data = await getTokenProbabilities(prompt, selectedLM);
        // Call the provided callback to add children to the root node
        addChildren(data.tokens, data.probabilities);
      } catch (error) {
        console.error("Error fetching initial tokens:", error);
      }
    },
    [selectedLM]
  );

  return (
    <SearchTreeProvider
      initialPrompt={initialPrompt}
      onInitialize={handleInitialize}
    >
      <TokenSearchContent />
    </SearchTreeProvider>
  );
};
