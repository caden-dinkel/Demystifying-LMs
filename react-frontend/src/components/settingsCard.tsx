import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardTitle, CardHeader } from "./card";
import { ThemeSwitch } from "./themeSwitch";
import { FunctionSwitch } from "./functionSwitch";
import settings from "@/styles/settings.module.css";
import { Button } from "@/components/button";
import { Settings as SettingsIcon } from "lucide-react";
import button from "@/styles/button.module.css";
import { LMSwitch } from "./lmSwitch";

export const SettingsCard = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
            <FunctionSwitch></FunctionSwitch>
            <h4 className={settings.sectionLabel}>Language Model</h4>
            <LMSwitch></LMSwitch>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
