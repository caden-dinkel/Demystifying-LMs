import {
  InputGroupTextarea,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { ArrowUpIcon } from "@radix-ui/react-icons";
import {
  useState,
  useCallback,
  useEffect,
  ReactNode,
  ReactElement,
} from "react";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import { Spinner } from "./ui/spinner";
import { LMSelector } from "./settings/lmSelector";
import { Button } from "./ui/button";
import React from "react";

interface ExampleButtonProps {
  setInputValue: (value: string) => void;
  disabled: boolean;
  exampleText?: string;
}

interface LMTextareaProps {
  onSend: (input: string, mode: string) => void | Promise<void>;
  placeholder?: string;
  messageRepliedTo?: boolean;
  exampleButton?: ReactElement<ExampleButtonProps>;
}

export const LMTextarea = ({
  onSend,
  placeholder = "Ask, Search or Chat...",
  messageRepliedTo,
  exampleButton,
}: LMTextareaProps) => {
  // Get current model from settings
  const { selectedLM, setSelectedLM } = useLMSettings();

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Function to inject text into the textarea's state from the example button
  const setExternalInputValue = useCallback((value: string) => {
    setInputValue(value);
  }, []);

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
            {/* Clones the exampleButton element, injecting the internal state handlers */}
            {exampleButton &&
              React.cloneElement(exampleButton, {
                setInputValue: setExternalInputValue,
                disabled: isLoading,
              })}
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
// ExamplePromptButton: uses the optional exampleText prop
export const ExamplePromptButton = ({
  setInputValue,
  disabled,
  exampleText,
}: ExampleButtonProps) => {
  // Fallback prompt if no specific text is provided in props
  const DEFAULT_PROMPT = "The capital of France is ";

  // Determine the prompt to use
  const promptToUse = exampleText || DEFAULT_PROMPT;

  const handleClick = () => {
    setInputValue(promptToUse);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className="mr-2"
    >
      Show Example
    </Button>
  );
};
