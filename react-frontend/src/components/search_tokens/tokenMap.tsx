// tokenMap.tsx

import { TokenChip } from "@/components/search_tokens/tokenChip";
import { TokenData } from "@/lib/types";
import React, { useRef, useEffect, useCallback, useState } from "react";

export interface TokenMapProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData[];
  onSelection: (selectedToken: string, startCoords: DOMRect) => void;
  onRender: (domRects: DOMRect[]) => void;
}

export const TokenMap = React.memo(
  ({ tokenData, onSelection, onRender }: TokenMapProps) => {
    const collectedRectsRef = useRef<DOMRect[]>([]);
    const [renderCount, setRenderCount] = useState(0);

    // Stable callback that doesn't change between renders
    const handleChipRender = useCallback(
      (domRect: DOMRect) => {
        collectedRectsRef.current.push(domRect);

        // When we've collected all rects, notify parent
        if (collectedRectsRef.current.length === tokenData.length) {
          onRender(collectedRectsRef.current);
          collectedRectsRef.current = []; // Clear for next update
        }
      },
      [tokenData.length, onRender]
    );

    // Reset collected rects when tokenData changes
    useEffect(() => {
      collectedRectsRef.current = [];
      setRenderCount((prev) => prev + 1); // Force re-render of chips
    }, [tokenData]);

    return (
      <>
        {tokenData.map((token) => (
          <TokenChip
            id={token.id}
            key={token.id}
            token={token.token}
            prob={token.prob}
            onSelection={onSelection}
            onRender={handleChipRender}
            size="sm"
            variant="secondary"
          />
        ))}
      </>
    );
  }
);
