import { TokenMap } from "@/components/tokenMap";

//
export interface TreeNode {
  id: string;
  token: string;
  prob: number;
  parentNodeId: string | null;
  childrenNodeIds: string[];
  isSelected: boolean;
}

export interface TokenData {
  id: string;
  token: string;
  prob: number;
}
