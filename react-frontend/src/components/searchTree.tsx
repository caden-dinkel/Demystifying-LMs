import { TreeNode } from "@/components/treeNode";
import { useEffect, useState } from "react";
import { getTokenProbabilities } from "@/api/getTokenProbs";
import { PromptDisplay } from "@/components/promptDisplay";
import { TokenMap } from "@/components/tokenMap";

export interface SearchTreeProps {
  initialPrompt: string;
}

export const SearchTree = ({ initialPrompt }: SearchTreeProps) => {
  const [searchTree, setSearchTree] = useState<Map<String, TreeNode>>(() => {
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
              childrenNodeIds: data.tokens, // Populate the children IDs
            };

            // Add the new child nodes to the map
            // NOTE: You'd also loop through data.tokens to create and add the actual child TreeNodes here.
            for (var tokenIndex in data.tokens) {
              console.log(data.tokens.length);
              const newNode: TreeNode = {
                id: data.tokens[tokenIndex],
                token: data.tokens[tokenIndex],
                prob: data.probabilities[tokenIndex],
                parentNodeId: "initial",
                childrenNodeIds: [],
                isSelected: false,
              };
              newTree.set(data.tokens[tokenIndex], newNode);
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
  }, [initialPrompt]); // Rerun only when initialPrompt changes

  // ... rest of the component

  const handleNextToken = async (selectedToken: string) => {
    const currentPrompt = searchPath.join(" ") + " " + selectedToken;
    const currentPathEndId = searchPath[searchPath.length - 1];
    const currentPathEndNode = searchTree.get(currentPathEndId);
    const newPathEndId = selectedToken;
    const newPathEndNode = searchTree.get(selectedToken);

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
            childrenNodeIds: data.tokens,
          };

          for (var tokenIndex in data.tokens) {
            const newNode: TreeNode = {
              id: data.tokens[tokenIndex],
              token: data.tokens[tokenIndex],
              prob: data.probabilities[tokenIndex],
              parentNodeId: newPathEndId,
              childrenNodeIds: [],
              isSelected: false,
            };
            newTree.set(data.tokens[tokenIndex], newNode);
          }
          newTree.set(currentPathEndId, updatedCurrentNode);
          newTree.set(newPathEndId, updatedNewNode);
        }
        //Update search path to new node
        setSearchPath((prevPath) => {
          return [...prevPath, newPathEndId];
        });
        return newTree;
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleDoNothing = (selectedNodeID: string) => {
    console.log(selectedNodeID);
  };

  const lastNodeId = searchPath[searchPath.length - 1];
  const childrenIds = searchTree.get(lastNodeId)?.childrenNodeIds ?? [];

  const validChildrenNodes = childrenIds
    .map((id) => searchTree.get(id))
    .filter((node): node is TreeNode => node !== undefined);

  const validChildTokens = validChildrenNodes.map((node) => node.token);
  const validChildProbs = validChildrenNodes.map((node) => node.prob);

  console.log(searchPath);

  console.log(lastNodeId);
  console.log(childrenIds);
  console.log(validChildProbs);
  console.log(validChildTokens);
  return (
    <div>
      <div>
        <PromptDisplay
          pathNodes={searchPath
            .map((nodeId) => searchTree.get(nodeId))
            .filter((node): node is TreeNode => node !== undefined)}
          onNodeClick={handleDoNothing}
        />
      </div>
      <div>
        <TokenMap
          tokens={validChildTokens}
          probs={validChildProbs}
          onSelection={handleNextToken}
        ></TokenMap>
      </div>
    </div>
  );
};
