import { TokenData } from "@/lib/types";
import styles from "@/styles/tokens.module.css";
import { PromptToken } from "./promptToken";
import { postTokenizeText } from "@/api/postTokenizeText";

export interface PromptDisplayProps {
  currentTokens: TokenData[];
  onNodeClick: (selectedNodeId: string) => void;
}

export const PromptDisplay = ({
  currentTokens,
  onNodeClick,
}: PromptDisplayProps) => {
  console.log(currentTokens);
  try {
    const data = await postTokenizeText(currentTokens.join(" "));
    console.log(data);
  } catch (error) {}

  return (
    <div className={styles.promptTokenContainer}>
      {currentTokens.map((tokenData) => (
        <PromptToken
          key={tokenData.id}
          id={tokenData.id}
          token={tokenData.token}
          onNodeClick={onNodeClick}
        />
      ))}
    </div>
  );
};
