// tokenMap.tsx

import { TokenChip } from "@/components/search_tokens/tokenChip";
import { TokenData } from "@/utilities/types";
import React, { useMemo } from "react";

export interface TokenMapProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData[];
  onSelection: (selectedToken: string, startCoords: DOMRect) => void;
}

export const TokenMap = React.memo(
  ({ tokenData, onSelection }: TokenMapProps) => {
    const renderedChips = useMemo(
      () =>
        tokenData.map((token) => (
          <TokenChip
            id={token.id}
            key={token.id}
            token={token.token}
            prob={token.prob}
            token_id={token.token_id}
            onSelection={onSelection}
            size="sm"
            variant="secondary"
          />
        )),
      [tokenData, onSelection]
    );

    return <div style={{ display: "contents" }}>{renderedChips}</div>;
  }
);

TokenMap.displayName = "TokenMap";
