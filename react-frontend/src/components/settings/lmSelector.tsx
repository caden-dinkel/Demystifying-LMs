import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GPT_LM, LLAMA_LM, CHESS_LLAMA_LM } from "@/api/config";

export interface LMSelectorProps {
  selectedLM: string;
  onLMChange: (lm: string) => void;
}

export const LMSelector = ({ selectedLM, onLMChange }: LMSelectorProps) => {
  return (
    <Select value={selectedLM} onValueChange={onLMChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Available Models</SelectLabel>
          <SelectItem value={GPT_LM}>
            GPT-2
            <span className="inline-block h-3 w-px bg-gray-400 mx-2 align-middle" />
            Text Completion
          </SelectItem>
          <SelectItem value={LLAMA_LM}>
            Llama-3.2
            <span className="inline-block h-3 w-px bg-gray-400 mx-2 align-middle" />
            Query Response
          </SelectItem>
          <SelectItem value={CHESS_LLAMA_LM}>
            Chess-Llama
            <span className="inline-block h-3 w-px bg-gray-400 mx-2 align-middle" />
            Chess Moves
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
