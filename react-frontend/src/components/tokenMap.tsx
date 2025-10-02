import { TokenChip } from "@/components/tokenChip";
export interface TokenMapProps extends React.HTMLAttributes<HTMLDivElement> {
  tokens: string[];
  probs: number[];
  onSelection: (selectedToken: string) => void;
}

export const TokenMap = ({ tokens, probs, onSelection }: TokenMapProps) => {
  return (
    <div className="flex flex-col space-y-2 token-map-container">
      {tokens.map((token, index) => (
        <TokenChip
          key={token + index}
          token={token}
          prob={probs[index]}
          onSelection={onSelection}
          size="sm"
          variant="secondary"
        />
      ))}
    </div>
  );
};
