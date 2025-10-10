import { TreeNode } from "@/api/types";
import { useEffect, useState, useRef } from "react";
import { getTokenProbabilities } from "@/api/getTokenProbs";
import { PromptDisplay } from "@/components/promptDisplay";
import { TokenMap } from "@/components/tokenMap";
import { TokenData } from "@/api/types";

export interface SearchTreeProps {
  initialPrompt: string;
}

export const SearchTree = ({ initialPrompt }: SearchTreeProps) => {
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

  //Probably need to get rid of useEffect
  useEffect(() => {
    if (!initialPrompt) return;

    const fetchInitialTokens = async () => {
      try {
        const data = await getTokenProbabilities(initialPrompt);

        setSearchTree((prevTree) => {
          const newTree = new Map(prevTree);
          const rootNode = newTree.get("initial");

          if (rootNode) {
            const updatedRootNode: TreeNode = {
              ...rootNode,
              childrenNodeIds: data.tokens.map(() => getNextId()), // Populate the children IDs
            };

            // Add the new child nodes to the map
            // NOTE: You'd also loop through data.tokens to create and add the actual child TreeNodes here.
            for (var tokenIndex in data.tokens) {
              console.log(data.tokens.length);
              const newNode: TreeNode = {
                id: updatedRootNode.childrenNodeIds[tokenIndex],
                token: data.tokens[tokenIndex],
                prob: data.probabilities[tokenIndex],
                parentNodeId: "initial",
                childrenNodeIds: [],
                isSelected: false,
              };
              newTree.set(newNode.id, newNode);
            }
            newTree.set("initial", updatedRootNode);
          }
          return newTree;
        });
      } catch (error) {
        console.error("Error fetching initial tokens:", error);
      }
    };

    fetchInitialTokens();
  }, []); // Rerun only when initialPrompt changes

  // ... rest of the component

  const handleNextToken = async (selectedId: string) => {
    const currentPrompt =
      searchPath.map((id) => searchTree.get(id)?.token).join(" ") +
      " " +
      searchTree.get(selectedId)?.token;
    const currentPathEndId = searchPath[searchPath.length - 1];
    const currentPathEndNode = searchTree.get(currentPathEndId);
    const newPathEndId = selectedId;
    const newPathEndNode = searchTree.get(newPathEndId);

    console.log(currentPrompt);
    try {
      const data = await getTokenProbabilities(currentPrompt);
      setSearchTree((prevTree) => {
        const newTree = new Map(prevTree);
        //Need to disable prior isSelected
        if (currentPathEndNode && newPathEndNode) {
          const updatedCurrentNode: TreeNode = {
            ...currentPathEndNode,
            isSelected: false,
          };

          const updatedNewNode: TreeNode = {
            ...newPathEndNode,
            isSelected: true,
            childrenNodeIds: data.tokens.map(() => getNextId()),
          };

          for (var tokenIndex in data.tokens) {
            const newNode: TreeNode = {
              id: updatedNewNode.childrenNodeIds[tokenIndex],
              token: data.tokens[tokenIndex],
              prob: data.probabilities[tokenIndex],
              parentNodeId: newPathEndId,
              childrenNodeIds: [],
              isSelected: false,
            };
            newTree.set(newNode.id, newNode);
          }
          newTree.set(currentPathEndId, updatedCurrentNode);
          newTree.set(newPathEndId, updatedNewNode);
        }
        //Update search path to new node
        return newTree;
      });
      setSearchPath((prevPath) => {
        return [...prevPath, newPathEndId];
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleDoNothing = (selectedNodeID: string) => {
    console.log(selectedNodeID);
  };
  const lastId = searchPath[searchPath.length - 1];
  const childNodes = searchTree
    .get(lastId)
    ?.childrenNodeIds?.map((id) => searchTree.get(id));
  const tokenData: TokenData[] =
    childNodes
      ?.filter((node): node is TreeNode => node !== undefined)
      .map((node) => ({
        id: node.id,
        token: node.token,
        prob: node.prob,
      }))
      .filter((data): data is TokenData => data !== undefined) ?? [];
  const currentTokens: TokenData[] =
    searchPath
      .map((id) => searchTree.get(id))
      .filter((node): node is TreeNode => node !== undefined)
      .map((node) => ({
        id: node.id,
        token: node.token,
        prob: node.prob,
      })) ?? [];
  return (
    <div style={{ display: "flex" }}>
      <PromptDisplay
        currentTokens={currentTokens}
        onNodeClick={handleDoNothing}
      />
      <TokenMap tokenData={tokenData} onSelection={handleNextToken}></TokenMap>
    </div>
  );
};
