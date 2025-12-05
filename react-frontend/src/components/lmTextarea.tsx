import {
  InputGroupTextarea,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { ArrowUpIcon } from "@radix-ui/react-icons";
import { useState, useCallback, useEffect } from "react";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import { Spinner } from "./ui/spinner";
import { LMSelector } from "./settings/lmSelector";

interface LMTextareaProps {
  onSend: (input: string, mode: string) => void | Promise<void>;
  placeholder?: string;
  // Marker to indicate when to end loading state.
  messageRepliedTo?: boolean;
}

export const LMTextarea = ({
  onSend,
  placeholder = "Ask, Search or Chat...",
  messageRepliedTo,
}: LMTextareaProps) => {
  // Get current model from settings
  const { selectedLM, setSelectedLM } = useLMSettings();

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update loading state when message is replied to
  useEffect(() => {
    if (messageRepliedTo) {
      setIsLoading(false);
    }
  }, [messageRepliedTo]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
    },
    []
  );

  const handleKeyPress = useCallback(
    async (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const trimmedInput = inputValue.trim();
        if (trimmedInput) {
          setIsLoading(true);
          try {
            await onSend(trimmedInput, selectedLM);
          } finally {
            setIsLoading(false);
          }
          setInputValue("");
        }
      }
    },
    [inputValue, selectedLM, onSend]
  );

  const handleClickSend = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (trimmedInput) {
      setIsLoading(true);
      try {
        await onSend(trimmedInput, selectedLM);
      } finally {
        setIsLoading(false);
      }
      setInputValue("");
    }
  }, [inputValue, selectedLM, onSend]);

  return (
    <InputGroup>
      <InputGroupTextarea
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        disabled={isLoading}
      />
      <InputGroupAddon align="block-end">
        <LMSelector selectedLM={selectedLM} onLMChange={setSelectedLM} />
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <InputGroupText className="ml-auto">Send</InputGroupText>
            <Separator orientation="vertical" className="!h-4" />
            <InputGroupButton
              variant="default"
              className="rounded-full"
              size="icon-xs"
              onClick={() => handleClickSend()}
              disabled={!inputValue.trim() || isLoading}
            >
              <ArrowUpIcon />
            </InputGroupButton>
          </>
        )}
      </InputGroupAddon>
    </InputGroup>
  );
};
