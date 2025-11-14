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
import {
  SAMPLING_SEARCH,
  ASSISTED_SEARCH,
  GREEDY_SEARCH,
  BEAM_SEARCH,
} from "@/api/config";
import { on } from "events";

export interface SearchMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (lm: string) => void;
}

export const SearchMethodSelector = ({
  selectedMethod,
  onMethodChange,
}: SearchMethodSelectorProps) => {
  return (
    <Select value={selectedMethod} onValueChange={onMethodChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Searching Methods</SelectLabel>
          <SelectItem value={GREEDY_SEARCH}>Greedy Search</SelectItem>
          <SelectItem value={BEAM_SEARCH}>Beam Search</SelectItem>
          <SelectItem value={SAMPLING_SEARCH}>Sampling Search</SelectItem>
          <SelectItem value={ASSISTED_SEARCH}>Assisted Search</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
