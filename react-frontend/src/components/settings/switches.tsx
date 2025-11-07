import { Monitor, Moon, Sun } from "lucide-react";
import { ToggleButton, ToggleOption } from "../toggleButtons";
import { useState } from "react";
import { useTheme } from "next-themes";

const themes: ToggleOption[] = [
  {
    key: "system",
    // To render an icon component, you often pass it as an element
    // Here we wrap the component in <>, but for ToggleButton, we can simplify
    icon: <Monitor size={18} />,
    label: "System theme",
  },
  {
    key: "light",
    icon: <Sun size={18} />,
    label: "Light theme",
  },
  {
    key: "dark",
    icon: <Moon size={18} />,
    label: "Dark theme",
  },
];

export const ThemeSwitch = () => {
  const { setTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState("system");
  return (
    <>
      <ToggleButton
        options={themes}
        onChange={(value) => {
          setTheme(value);
          setCurrentTheme(value);
        }}
        value={currentTheme}
      ></ToggleButton>
    </>
  );
};

