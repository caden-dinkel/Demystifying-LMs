import { Button, ButtonProps } from "@/components/button";

export interface TokenChipProps extends Omit<ButtonProps, "onClick"> {
  token: string;
  prob: number;

  //This will check if that next branch is already stored on client
  //If not, will send request to backend for next prob spread
  onSelection: (selectedToken: string) => void;
}

export const TokenChip = ({
  token,
  prob,
  onSelection,
  ...props
}: TokenChipProps) => {
  return (
    <Button onClick={() => onSelection(token)} {...props}>
      {token}: {prob}
    </Button>
  );
};
