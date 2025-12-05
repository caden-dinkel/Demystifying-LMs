import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { TreeNode, TokenData } from "@/utilities/types";

// ============================================
// Types
// ============================================

interface SearchTreeState {
  searchTree: Map<string, TreeNode>;
  searchPath: string[];
  animationData: { startCoords: DOMRect; endId: string } | null;
}

interface SearchTreeActions {
  // ID generation
  getNextId: () => string;

  // Tree initialization
  initializeTree: (initialPrompt: string) => void;
  resetTree: () => void;

  // Tree mutations (call these after API fetch)
  addChildrenToNode: (
    nodeId: string,
    tokens: string[],
    probabilities: number[],
    tokenIds?: number[]
  ) => string[]; // Returns the IDs of the newly added children
  selectNode: (nodeId: string) => void;
  deselectNode: (nodeId: string) => void;

  // Path navigation
  moveToNode: (nodeId: string) => void;
  navigateBack: (nodeId: string) => void;

  // Animation
  setAnimationData: (
    data: { startCoords: DOMRect; endId: string } | null
  ) => void;

  // Utility
  normalizeProbabilities: (probabilities: number[]) => number[];
  buildPromptFromPath: () => string;
  getNodeById: (id: string) => TreeNode | undefined;
}

interface SearchTreeDerivedState {
  lastNodeId: string;
  lhsTokenData: TokenData[];
  rhsTokenData: TokenData[];
  currentPrompt: string;
}

interface SearchTreeContextType
  extends SearchTreeState,
    SearchTreeActions,
    SearchTreeDerivedState {}

// ============================================
// Context
// ============================================

const SearchTreeContext = createContext<SearchTreeContextType | undefined>(
  undefined
);

export const useSearchTree = () => {
  const context = useContext(SearchTreeContext);
  if (!context) {
    throw new Error("useSearchTree must be used within a SearchTreeProvider");
  }
  return context;
};

// ============================================
// Provider
// ============================================

interface SearchTreeProviderProps {
  children: ReactNode;
  initialPrompt?: string;
  onInitialize?: (
    prompt: string,
    addChildren: (tokens: string[], probabilities: number[]) => void
  ) => Promise<void>; // Callback for initial API call
}

export const SearchTreeProvider: React.FC<SearchTreeProviderProps> = ({
  children,
  initialPrompt,
  onInitialize,
}) => {
  // ============================================
  // State
  // ============================================

  const nextIdRef = useRef(0);
  const [searchTree, setSearchTree] = useState<Map<string, TreeNode>>(
    new Map()
  );
  const [searchPath, setSearchPath] = useState<string[]>([]);
  const [animationData, setAnimationData] = useState<{
    startCoords: DOMRect;
    endId: string;
  } | null>(null);

  // ============================================
  // ID Generation
  // ============================================

  const getNextId = useCallback((): string => {
    const newId = nextIdRef.current.toString();
    nextIdRef.current += 1;
    return newId;
  }, []);

  // ============================================
  // Utility Functions
  // ============================================

  const normalizeProbabilities = useCallback(
    (probabilities: number[]): number[] => {
      const sum = probabilities.reduce((acc, prob) => acc + prob, 0);
      if (sum === 0) return probabilities.map(() => 0);
      return probabilities.map((prob) => prob / sum);
    },
    []
  );

  const getNodeById = useCallback(
    (id: string): TreeNode | undefined => {
      return searchTree.get(id);
    },
    [searchTree]
  );

  const buildPromptFromPath = useCallback((): string => {
    return searchPath
      .map((id) => searchTree.get(id)?.token)
      .filter((t): t is string => t !== undefined)
      .join("");
  }, [searchPath, searchTree]);

  // ============================================
  // Tree Initialization
  // ============================================

  const initializeTree = useCallback(
    async (prompt: string) => {
      const rootNode: TreeNode = {
        id: "initial",
        token: prompt,
        prob: 1,
        parentNodeId: null,
        childrenNodeIds: [],
        isSelected: true,
      };

      setSearchTree(new Map([["initial", rootNode]]));
      setSearchPath(["initial"]);
      setAnimationData(null);
      nextIdRef.current = 0;

      // Provide callback to add children after API call
      if (onInitialize) {
        const addInitialChildren = (
          tokens: string[],
          probabilities: number[]
        ) => {
          const normalizedProbs = normalizeProbabilities(probabilities);
          const newChildrenIds = tokens.map(() => getNextId());

          setSearchTree((prevTree) => {
            const newTree = new Map(prevTree);
            const rootNode = newTree.get("initial");
            if (!rootNode) return prevTree;

            // Update root node with children IDs
            newTree.set("initial", {
              ...rootNode,
              childrenNodeIds: newChildrenIds,
            });

            // Add new child nodes
            tokens.forEach((token, index) => {
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
        };

        await onInitialize(prompt, addInitialChildren);
      }
    },
    [onInitialize, getNextId, normalizeProbabilities]
  );

  const resetTree = useCallback(() => {
    setSearchTree(new Map());
    setSearchPath([]);
    setAnimationData(null);
    nextIdRef.current = 0;
  }, []);

  // ============================================
  // Tree Mutations
  // ============================================

  const addChildrenToNode = useCallback(
    (
      nodeId: string,
      tokens: string[],
      probabilities: number[],
      tokenIds?: number[]
    ): string[] => {
      const normalizedProbs = normalizeProbabilities(probabilities);
      const newChildrenIds = tokens.map(() => getNextId());

      setSearchTree((prevTree) => {
        const newTree = new Map(prevTree);
        const node = newTree.get(nodeId);

        if (!node) return prevTree;

        // Update parent node with children IDs
        newTree.set(nodeId, {
          ...node,
          childrenNodeIds: newChildrenIds,
        });

        // Add new child nodes
        tokens.forEach((token, index) => {
          newTree.set(newChildrenIds[index], {
            id: newChildrenIds[index],
            token: token,
            prob: normalizedProbs[index],
            token_id: tokenIds?.[index],
            parentNodeId: nodeId,
            childrenNodeIds: [],
            isSelected: false,
          });
        });

        return newTree;
      });

      // Return the new child IDs so caller can use them immediately
      return newChildrenIds;
    },
    [getNextId, normalizeProbabilities]
  );

  const selectNode = useCallback((nodeId: string) => {
    setSearchTree((prevTree) => {
      const newTree = new Map(prevTree);
      const node = newTree.get(nodeId);
      if (node) {
        newTree.set(nodeId, { ...node, isSelected: true });
      }
      return newTree;
    });
  }, []);

  const deselectNode = useCallback((nodeId: string) => {
    setSearchTree((prevTree) => {
      const newTree = new Map(prevTree);
      const node = newTree.get(nodeId);
      if (node) {
        newTree.set(nodeId, { ...node, isSelected: false });
      }
      return newTree;
    });
  }, []);

  // ============================================
  // Path Navigation
  // ============================================

  const moveToNode = useCallback((nodeId: string) => {
    setSearchPath((prevPath) => [...prevPath, nodeId]);
  }, []);

  const navigateBack = useCallback((nodeId: string) => {
    setSearchPath((prevPath) => {
      const selectedIndex = prevPath.findIndex((id) => id === nodeId);
      if (selectedIndex === -1) return prevPath;

      const newPath = prevPath.slice(0, selectedIndex + 1);

      setSearchTree((prevTree) => {
        const newTree = new Map(prevTree);

        // Deselect nodes that were truncated from the path
        prevPath.slice(selectedIndex + 1).forEach((idToDeselect) => {
          const node = newTree.get(idToDeselect);
          if (node) {
            newTree.set(idToDeselect, { ...node, isSelected: false });
          }
        });

        // Select the target node
        const newEndNode = newTree.get(nodeId);
        if (newEndNode) {
          newTree.set(nodeId, { ...newEndNode, isSelected: true });
        }

        return newTree;
      });

      return newPath;
    });
  }, []);

  // ============================================
  // Derived State
  // ============================================

  const lastNodeId = searchPath[searchPath.length - 1] || "";

  const lhsTokenData: TokenData[] =
    searchPath
      .map((id) => searchTree.get(id))
      .filter((node): node is TreeNode => node !== undefined)
      .map((node) => ({
        id: node.id,
        token: node.token,
        prob: node.prob,
        token_id: node.token_id,
      })) || [];

  const rhsTokenData: TokenData[] =
    searchTree
      .get(lastNodeId)
      ?.childrenNodeIds?.map((id) => searchTree.get(id))
      .filter((node): node is TreeNode => node !== undefined)
      .map((node) => ({
        id: node.id,
        token: node.token,
        prob: node.prob,
        token_id: node.token_id,
      })) || [];

  const currentPrompt = buildPromptFromPath();

  // ============================================
  // Initialize on Mount
  // ============================================

  useEffect(() => {
    if (initialPrompt) {
      initializeTree(initialPrompt);
    } else {
      resetTree();
    }
  }, [initialPrompt]); // Only re-run if initialPrompt changes

  // ============================================
  // Context Value
  // ============================================

  const value: SearchTreeContextType = {
    // State
    searchTree,
    searchPath,
    animationData,

    // Actions
    getNextId,
    initializeTree,
    resetTree,
    addChildrenToNode,
    selectNode,
    deselectNode,
    moveToNode,
    navigateBack,
    setAnimationData,
    normalizeProbabilities,
    buildPromptFromPath,
    getNodeById,

    // Derived State
    lastNodeId,
    lhsTokenData,
    rhsTokenData,
    currentPrompt,
  };

  return (
    <SearchTreeContext.Provider value={value}>
      {children}
    </SearchTreeContext.Provider>
  );
};
