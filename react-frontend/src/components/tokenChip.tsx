import { Button, ButtonProps } from "@/components/button";
import styles from "@/styles/tokens.module.css";
import { ProbBar } from "./probBar";

export interface TokenChipProps extends ButtonProps {
  id: string;
  token: string;
  prob: number;
  onSelection: (selectedToken: string) => void;
}

export const TokenChip = ({
  id,
  token,
  prob,
  onSelection,
  ...props
}: TokenChipProps) => {
  return (
    <div className={styles.tokenChipWrapper}>
      {/* 1. The Interactive Button */}
      <Button
        className={styles.tokenChipButton}
        onClick={() => onSelection(id)}
        {...props}
      >
        <span className={styles.tokenText}>{token}</span>
        <span className={styles.probText}>{Math.round(prob * 1000) / 10}%</span>
      </Button>
      <ProbBar prob={prob}></ProbBar>
    </div>
  );
};
