import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { TokenData } from "@/api/types";
import { TokenMap } from "./tokenMap";

export interface PromptDisplayProps {
  currentTokens: TokenData[];
  onNodeClick: (selectedNodeId: string) => void;
}

export const PromptDisplay = ({
  currentTokens,
  onNodeClick,
}: PromptDisplayProps) => {
  console.log(currentTokens);
  return (
    // The main container for the left side
    <Card className="w-1/2 min-w-[400px]">
      {/* Optional: Title for context */}
      <CardHeader>
        <CardTitle>Current Search Path</CardTitle>
      </CardHeader>

      {/* Container for the tokens */}
      <CardContent className="flex flex-wrap gap-2 p-4">
        <TokenMap
          tokenData={currentTokens}
          onSelection={onNodeClick}
        ></TokenMap>
      </CardContent>
    </Card>
  );
};
