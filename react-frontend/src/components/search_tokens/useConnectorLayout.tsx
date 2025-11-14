import React, { createContext, useContext, useCallback, useMemo } from "react";

interface ConnectorLayout {
  lhsBox: DOMRect | null;
  rhsBoxes: DOMRect[];
  parentContainer: DOMRect | null;
}

interface ConnectorLayoutContextType extends ConnectorLayout {
  setParentContainer: (box: DOMRect) => void;
  handleLHSTokenRender: (rect: DOMRect) => void;
  handleRHSTokenRender: (rects: DOMRect[]) => void;
}

const ConnectorLayoutContext = createContext<
  ConnectorLayoutContextType | undefined
>(undefined);

export const useConnectorLayout = () => {
  const context = useContext(ConnectorLayoutContext);
  if (!context) {
    throw new Error(
      "useConnectorLayout must be used within a ConnectorLayoutProvider"
    );
  }
  return context;
};

interface ConnectorLayoutProviderProps {
  children: React.ReactNode;
}

export const ConnectorLayoutProvider: React.FC<
  ConnectorLayoutProviderProps
> = ({ children }) => {
  const [lhsBox, setLhsBox] = React.useState<DOMRect | null>(null);
  const [rhsBoxes, setRhsBoxes] = React.useState<DOMRect[]>([]);

  const [parentContainer, setParentContainer] = React.useState<DOMRect | null>(
    null
  );

  const handleLHSTokenRender = useCallback((rect: DOMRect) => {
    setLhsBox(rect);
  }, []);

  const handleRHSTokenRender = useCallback((rects: DOMRect[]) => {
    setRhsBoxes(rects);
  }, []);

  return (
    <ConnectorLayoutContext.Provider
      value={{
        lhsBox,
        rhsBoxes,
        parentContainer,
        setParentContainer: setParentContainer as (box: DOMRect) => void,
        handleLHSTokenRender,
        handleRHSTokenRender,
      }}
    >
      {children}
    </ConnectorLayoutContext.Provider>
  );
};
