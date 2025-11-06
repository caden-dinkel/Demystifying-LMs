// tokenChip.tsx
"use client";

import { useEffect } from "react";
import React, { useRef } from "react"; // <-- Import useRef
import { Button, ButtonProps } from "@/components/button";
import styles from "@/styles/tokens.module.css";
import { ProbBar } from "./probBar";
// ... (TokenChipProps remains the same)

export interface TokenChipProps extends ButtonProps {
  id: string;
  token: string;
  prob: number; // Probability from 0.0 to 1.0
  onSelection: (selectedToken: string, startCoords: DOMRect) => void;
  onRender?: (DOMRect: DOMRect) => void;
}

export const TokenChip = ({
  id,
  token,
  prob,
  onSelection,
  onRender,
  ...props
}: TokenChipProps) => {
  // 1. Create a ref to hold the button element
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    // 2. Safely check the ref and get measurements
    if (buttonRef.current) {
      const startCoords = buttonRef.current.getBoundingClientRect();
      onSelection(id, startCoords);
    }
  };

  useEffect(() => {
    if (onRender && buttonRef.current) {
      const domRect = buttonRef.current.getBoundingClientRect();
      onRender(domRect);
    }
  }, [id]); // Dependency array: call onRender when it changes

  return (
    <div>
      {/* 3. Pass the ref to the Button component */}
      <Button
        ref={buttonRef} // <-- Pass the ref here
        onClick={handleClick} // <-- Use the new handler
        // 4. Use useEffect to call onRender after mount
        // You can remove the id={id} prop from the button now, it's unnecessary
        {...props}
        className={styles.tokenMapItem}
      >
        <span>{token}</span>
        <span>{Math.round(prob * 1000) / 10}%</span>
      </Button>
      <ProbBar prob={prob}></ProbBar>
    </div>
  );
};
