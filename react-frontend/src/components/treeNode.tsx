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
