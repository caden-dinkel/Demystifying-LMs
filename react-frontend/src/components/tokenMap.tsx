import { TokenChip } from "@/components/tokenChip";
import { TokenData } from "./treeNode";
export interface TokenMapProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData[];
  onSelection: (selectedToken: string) => void;
}

export const TokenMap = ({ tokenData, onSelection }: TokenMapProps) => {
  return (
    <div className="token-map-container" style={{ display: "table-column" }}>
      {tokenData.map((token) => (
        <TokenChip
          id={token.id}
          key={token.id}
          token={token.token}
          prob={token.prob}
          onSelection={onSelection}
          size="sm"
          variant="secondary"
        />
      ))}
    </div>
  );
};
