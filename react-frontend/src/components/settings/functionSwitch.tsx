//Allows selection of querying vs text completion Language models

import { ToggleButton, ToggleOption } from "@/components/toggleButtons";
import { useState } from "react";

const functions: ToggleOption[] = [
  { key: "completion", label: "Text Completion" },
  { key: "query", label: "Query Response" },
];

export interface FunctionSwitchProps {
  onChange: (selectedFunction: string) => void;
  value: string;
}

export const FunctionSwitch = ({onChange, value}: FunctionSwitchProps) => {
  return (
    <>
      <ToggleButton
        options={functions}
        onChange={(value) => onChange(value)}
        value={value}
      ></ToggleButton>
    </>
  );
};
