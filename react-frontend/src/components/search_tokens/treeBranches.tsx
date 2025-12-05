import { ArrowConnector } from "./ArrowConnector";

export interface SearchTreeConnectorProps {
  animatingTokenIndex?: number | null;
}

/**
 * SearchTreeConnector - Renders D3-based arrows between prompt and tokens
 * Uses the ArrowConnector component for D3 rendering while keeping structure as React
 */
export const SearchTreeConnector = ({
  animatingTokenIndex = null,
}: SearchTreeConnectorProps) => {
  return <ArrowConnector animatingTokenIndex={animatingTokenIndex} />;
};
