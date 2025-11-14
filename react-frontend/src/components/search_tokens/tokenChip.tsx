// tokenChip.tsx
"use client";

import { useEffect } from "react";
import React, { useRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProbBar } from "./probBar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TokenChipProps extends ButtonProps {
  id: string;
  token: string;
  prob: number; // Probability from 0.0 to 1.0
  token_id?: number; // Optional token ID
  onSelection: (selectedToken: string, startCoords: DOMRect) => void;
  onRender?: (DOMRect: DOMRect) => void;
}

export const TokenChip = ({
  id,
  token,
  prob,
  token_id,
  onSelection,
  onRender,
  className,
  ...props
}: TokenChipProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
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
  }, [id, onRender]);

  return (
    <div className="flex flex-col gap-1 w-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={buttonRef}
              onClick={handleClick}
              variant="secondary"
              data-token-id={id}
              className={cn(
                "flex w-full items-center justify-between gap-2",
                "min-w-[150px] h-auto px-3 py-2",
                className
              )}
              {...props}
            >
              <span className="truncate flex-1 text-left">{token}</span>
              <span className="text-xs font-mono whitespace-nowrap">
                {Math.round(prob * 1000) / 10}%
              </span>
            </Button>
          </TooltipTrigger>
          {token_id !== undefined && (
            <TooltipContent>
              <p>Token ID: {token_id}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <ProbBar prob={prob} />
    </div>
  );
};
