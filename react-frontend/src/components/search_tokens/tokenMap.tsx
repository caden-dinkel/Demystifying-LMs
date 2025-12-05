// tokenMap.tsx

import { TokenChip } from "@/components/search_tokens/tokenChip";
import { TokenData } from "@/utilities/types";
import React, { useRef, useEffect, useCallback, useMemo } from "react";

export interface TokenMapProps extends React.HTMLAttributes<HTMLDivElement> {
  tokenData: TokenData[];
  onSelection: (selectedToken: string, startCoords: DOMRect) => void;
  onRender: (domRects: DOMRect[]) => void;
}

/**
 * TokenMap - React component that displays tokens as chips
 * Collects DOM rects and notifies parent when layout is ready
 */
export const TokenMap = React.memo(
  ({ tokenData, onSelection, onRender }: TokenMapProps) => {
    const collectedRectsRef = useRef<Map<string, DOMRect>>(new Map());

    // Callback when individual chip renders
    const handleChipRender = useCallback(
      (tokenId: string, domRect: DOMRect) => {
        collectedRectsRef.current.set(tokenId, domRect);

        // When we've collected all rects, notify parent
        if (collectedRectsRef.current.size === tokenData.length) {
          const rects = Array.from(collectedRectsRef.current.values());
          onRender(rects);
        }
      },
      [tokenData.length, onRender]
    );

    // Reset collected rects when tokenData changes
    useEffect(() => {
      collectedRectsRef.current.clear();
    }, [tokenData]);

    // Memoize the rendered chips to avoid unnecessary re-renders
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
            onRender={(rect) => handleChipRender(token.id, rect)}
            size="sm"
            variant="secondary"
          />
        )),
      [tokenData, onSelection, handleChipRender]
    );

    return <div style={{ display: "contents" }}>{renderedChips}</div>;
  }
);

TokenMap.displayName = "TokenMap";
