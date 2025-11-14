import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

export interface ToggleOption {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  blocked?: boolean;
}

export interface ToggleButtonProps {
  options: ToggleOption[];
  onChange: (selectedKey: string) => void;
  value: string;
}

export const ToggleButton = ({
  options,
  onChange,
  value,
}: ToggleButtonProps) => {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {options.map((option) => (
        <Button
          key={option.key}
          disabled={option.blocked}
          onClick={() => onChange(option.key)}
          variant={option.key === value ? "default" : "secondary"}
          className={cn(
            "transition-all",
            option.key === value && "font-semibold"
          )}
        >
          {option.icon ? option.icon : option.label}
        </Button>
      ))}
    </div>
  );
};
