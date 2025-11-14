import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings as SettingsIcon } from "lucide-react";
import { LMSelector } from "./lmSelector";
import { Slider } from "@/components/ui/slider";
import { ThemeSwitcher } from "../ui/shadcn-io/theme-switcher";
import * as React from "react";
import { useLMSettings } from "./lmSettingsProvider";
import { Input } from "../ui/input";
import { Separator } from "@/components/ui/separator";
import { SearchMethodSelector } from "./searchMethodSelector";

export function SettingsPopover() {
  const {
    selectedLM,
    setSelectedLM,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    setSelectedSearchMethod,
    selectedSearchMethod,
  } = useLMSettings();

  const handleLMChange = React.useCallback((lm: string) => {
    setSelectedLM(lm);
  }, []);

  const handleSearchMethodChange = React.useCallback((method: string) => {
    setSelectedSearchMethod(method);
  }, []);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="ghost" size="icon" aria-label="Settings">
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Settings</h4>
            <p className="text-muted-foreground text-sm">
              Customize appearance and functionaility of the web-app.
            </p>
          </div>
          <div className="grid gap-2">
            <Separator />

            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="theme">Theme</Label>
              <ThemeSwitcher />
            </div>
            <Separator />
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="lm">Language Model</Label>
              <LMSelector onLMChange={handleLMChange} selectedLM={selectedLM} />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="search-method">Search Method</Label>
              <SearchMethodSelector
                selectedMethod={selectedSearchMethod}
                onMethodChange={handleSearchMethodChange}
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="temp">Temperature ({temperature})</Label>
              <Slider
                className="col-span-2"
                id="temp"
                value={temperature}
                max={100}
                step={1}
                onValueChange={setTemperature}
              ></Slider>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="max-tokens">Maximum Tokens</Label>
              <Input
                type="number"
                className="col-span-2"
                id="max-tokens"
                value={maxTokens}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) {
                    setMaxTokens(value);
                  }
                }}
              ></Input>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
