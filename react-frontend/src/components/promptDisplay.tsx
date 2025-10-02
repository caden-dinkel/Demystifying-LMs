import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { TokenChip } from "@/components/tokenChip";
import { TreeNode } from "@/components/treeNode";

export interface PromptDisplayProps {
  pathNodes: TreeNode[];
  onNodeClick: (selectedNodeId: string) => void;
}

export const PromptDisplay = ({
  pathNodes,
  onNodeClick,
}: PromptDisplayProps) => {
  return (
    // The main container for the left side
    <Card className="w-1/2 min-w-[400px]">
      {/* Optional: Title for context */}
      <CardHeader>
        <CardTitle>Current Search Path</CardTitle>
      </CardHeader>

      {/* Container for the tokens */}
      <CardContent className="flex flex-wrap gap-2 p-4">
        {pathNodes.map((node) => (
          <TokenChip
            key={node.id}
            token={node.token}
            prob={node.prob}
            // Use a ghost or secondary variant to show it's history
            variant="ghost"
            onSelection={() => onNodeClick(node.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
};
