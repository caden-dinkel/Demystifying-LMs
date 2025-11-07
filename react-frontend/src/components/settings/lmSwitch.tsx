import { ToggleButton, ToggleOption } from "../toggleButtons";

//Can add more later
//Still need to implement backend functionality
const lms: ToggleOption[] = [
  { key: "llama3", label: "Llama3" },
  { key: "gpt2", label: "GPT2" },
];

export interface LMSwitchProps {
  value: string;
  onChange: (selectedLM: string) => void;
}

export const LMSwitch = ({onChange, value}: LMSwitchProps) => {
  return (
    <>
      <ToggleButton
        options={lms}
        onChange={(value) => onChange(value)}
        value={value}
      ></ToggleButton>
    </>
  );
};
