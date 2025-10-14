import { ToggleButton, ToggleOption } from "./toggleButtons";
import { useState } from "react";

//Can add more later
//Still need to implement backend functionality
const lms: ToggleOption[] = [
  { key: "llama3", label: "Llama3" },
  { key: "gpt2", label: "GPT2" },
];

export const LMSwitch = () => {
  const [currentLM, setCurrentLM] = useState("gpt2");
  return (
    <>
      <ToggleButton
        options={lms}
        onChange={(value) => setCurrentLM(value)}
        value={currentLM}
      ></ToggleButton>
    </>
  );
};
