"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  DEFAULT_LM,
  DEFAULT_SEARCH_STRATEGY,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
} from "@/api/config";

interface LMSettings {
  selectedLM: string;
  temperature: number[];
  maxTokens: number;
  selectedSearchMethod: string;
}

interface LMSettingsContextType extends LMSettings {
  setSelectedLM: (lm: string) => void;
  setSelectedSearchMethod: (method: string) => void;
  setTemperature: (temp: number[]) => void;
  setMaxTokens: (maxTokens: number) => void;
}

const LMSettingsContext = createContext<LMSettingsContextType | undefined>(
  undefined
);

export const useLMSettings = () => {
  const context = useContext(LMSettingsContext);
  if (!context) {
    throw new Error("useLMSettings must be used within a LMSettingsProvider");
  }
  return context;
};

interface LMSettingsProviderProps {
  children: ReactNode;
}

export const LMSettingsProvider: React.FC<LMSettingsProviderProps> = ({
  children,
}) => {
  const [selectedLM, setSelectedLM] = useState<string>(DEFAULT_LM);
  const [selectedSearchMethod, setSelectedSearchMethod] = useState<string>(
    DEFAULT_SEARCH_STRATEGY
  );
  const [temperature, setTemperature] = useState<number[]>([
    DEFAULT_TEMPERATURE,
  ]);
  const [maxTokens, setMaxTokens] = useState<number>(DEFAULT_MAX_TOKENS);

  return (
    <LMSettingsContext.Provider
      value={{
        selectedLM,
        setSelectedLM,
        selectedSearchMethod,
        setSelectedSearchMethod,
        temperature,
        setTemperature,
        maxTokens,
        setMaxTokens,
      }}
    >
      {children}
    </LMSettingsContext.Provider>
  );
};
