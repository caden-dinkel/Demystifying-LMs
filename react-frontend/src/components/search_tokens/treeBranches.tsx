import { ArrowConnector } from "./ArrowConnector";

export interface SearchTreeConnectorProps {
  rhsBoxes: DOMRect[];
  lhsBox: DOMRect;
  parentRect: DOMRect | null;
  animatingTokenIndex?: number | null;
}

/**
 * SearchTreeConnector - Renders D3-based arrows between prompt and tokens
 * Uses the ArrowConnector component for D3 rendering while keeping structure as React
 */
export const SearchTreeConnector = ({
  rhsBoxes,
  lhsBox,
  parentRect,
  animatingTokenIndex = null,
}: SearchTreeConnectorProps) => {
  return (
    <ArrowConnector
      lhsBox={lhsBox}
      rhsBoxes={rhsBoxes}
      parentRect={parentRect}
      animatingTokenIndex={animatingTokenIndex}
    />
  );
};
