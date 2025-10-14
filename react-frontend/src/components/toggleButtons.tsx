import { Button } from "./button";
import styles from "@/styles/toggle.module.css";
import React from "react";

export interface ToggleOption {
  key: string;
  label?: string;
  icon?: React.ReactNode;
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
    <div className={styles.toggleGroup}>
      {options.map((option) => (
        <Button
          key={option.key}
          onClick={() => onChange(option.key)}
          className={
            option.key === value ? styles.toggleSelected : styles.toggleNormal
          }
        >
          {option.icon ? option.icon : option.label}
        </Button>
      ))}
    </div>
  );
};
