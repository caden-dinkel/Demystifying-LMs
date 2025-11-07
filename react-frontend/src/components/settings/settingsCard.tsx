import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/card";
import { ThemeSwitch } from "@/components/settings/themeSwitch";
import { FunctionSwitch } from "@/components/settings/functionSwitch";
import settings from "@/styles/settings.module.css";
import { Button } from "@/components/button";
import { Settings as SettingsIcon } from "lucide-react";
import button from "@/styles/button.module.css";
import { LMSwitch } from "@/components/settings/lmSwitch";
export const SettingsCard = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedLM, setSelectedLM] = useState<string>("gpt2");
  const [selectedFunction, setSelectedFunction] = useState<string>("completion");

  const handleLMSelection = useCallback((lm: string) => {
    setSelectedLM(lm);
  }, []);

  const handleFunctionSelection = useCallback((functionality: string) => {
    // GPT2 doesn't have query functionality (atm assuming all other have query and completion)
    if (selectedLM !==  "gpt2" || functionality !== "query") {
      setSelectedFunction(functionality);
    }
    else {
      setSelectedFunction("completion")
    }
  }, []);

  useEffect(() => {
    // Concatenate the values for the API call (e.g., "gpt2-completion" or "llama3.2-query")
    const apiRouteKey = `${selectedLM}-${selectedFunction}`;
    console.log("Current API Route Key:", apiRouteKey);

    // 💡 This is where you would trigger the API call or update a global context
    // or prop with the new key if the settings were changed.
  }, [selectedFunction, selectedLM]);

  useEffect(() => {
    // Type the event as MouseEvent
    const handleClickOutside = (event: MouseEvent) => {
      // event.target is of type EventTarget | null.
      // We assert it as a Node to use contains() properly.
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };

    // Add the listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup function
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={settings.settingsDropdownContainer} ref={dropdownRef}>
      <Button
        className={`${button.btnGhost} ${button.btnIcon}`}
        size="icon"
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        aria-expanded={isSettingsOpen}
        aria-label="Settings"
      >
        <SettingsIcon className="h-5 w-5" />
      </Button>
      {isSettingsOpen && (
        <Card className={settings.settingsCard}>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <div className={settings.cardSeparator}></div>

          <CardContent className="p-2">
            <h4 className={settings.sectionLabel}>Appearance</h4>
            <ThemeSwitch></ThemeSwitch>
            <h4 className={settings.sectionLabel}>
              Language Model Functionality
            </h4>
            <FunctionSwitch value={selectedFunction} onChange={handleFunctionSelection}>
            </FunctionSwitch>
            <h4 className={settings.sectionLabel}>Language Model</h4>
            <LMSwitch value={selectedLM} onChange={handleLMSelection}></LMSwitch>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
