//Allows selection of querying vs text completion Language models

import { ToggleButton, ToggleOption } from "./toggleButtons";
import { useState } from "react";

const functions: ToggleOption[] = [
  { key: "completion", label: "Text Completion" },
  { key: "query", label: "Query Response" },
];

export const FunctionSwitch = () => {
  const [currentFunction, setCurrentFunction] = useState("completion");
  return (
    <>
      <ToggleButton
        options={functions}
        onChange={(value) => setCurrentFunction(value)}
        value={currentFunction}
      ></ToggleButton>
    </>
  );
};
