// Holds context for logic for searching on generated tokens/probs
import { useState, useEffect, useRef, useCallback } from "react";

interface Node {
  id: string; // Unique identifier for the node
  tokenizer_value: number; // Value of a token in tokenizer
  token: string; // The token string
  prob: number; // Probability of the token
  parentNodeId: string | null; // ID of the parent node, null if root
  childrenNodeIds: string[]; // IDs of child nodes
  generatedText?: string; // Optional generated text at this node
}

export const searchTreeProvider = () => {
  // Ref to get unique new IDs
  const nextIdRef = useRef(0);

  const getNextId = useCallback((): string => {
    const newId = nextIdRef.current.toString();
    nextIdRef.current += 1;
    return newId;
  }, []);

  // State to hold all visited nodes
  const [nodes, setNodes] = useState<Record<string, Node>>({});

  // State for which node to display (Or nodes for d3 trees)
  const [paths, setPaths] = useState<Set<string>>(new Set());

  // Function to fetch a selected node
  const fetchNewNode = useCallback((nodeId: string) => {

  }, []);
};
