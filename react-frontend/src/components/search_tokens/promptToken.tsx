"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

export interface PromptTokenProps {
  id: string; // The ID is needed for the click handler
  token: string;
  onNodeClick: (selectedNodeID: string) => void;
}

export const PromptToken = ({ id, token, onNodeClick }: PromptTokenProps) => {
  return (
    <Button
      variant="secondary"
      size="sm"
      className={cn(
        "inline-flex cursor-pointer select-none transition-colors",
        "hover:bg-muted"
      )}
      onClick={() => onNodeClick(id)}
    >
      <span>{token}</span>
    </Button>
  );
};
