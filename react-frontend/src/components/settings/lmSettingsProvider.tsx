"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LMSettings {
  selectedLM: string;
  selectedFunction: string;
  modelName: string;
}

interface LMSettingsContextType extends LMSettings {
  setSelectedLM: (lm: string) => void;
  setSelectedFunction: (func: string) => void;
}

const LMSettingsContext = createContext<LMSettingsContextType | undefined>(undefined);

export const useLMSettings = () => {
  const context = useContext(LMSettingsContext);
  if (!context) {
    throw new Error('useLMSettings must be used within a LMSettingsProvider');
  }
  return context;
};

interface LMSettingsProviderProps {
  children: ReactNode;
}

export const LMSettingsProvider: React.FC<LMSettingsProviderProps> = ({ children }) => {
  const [selectedLM, setSelectedLM] = useState<string>('gpt2');
  const [selectedFunction, setSelectedFunction] = useState<string>('completion');

  const modelName = `${selectedLM}_${selectedFunction}`;

  return (
    <LMSettingsContext.Provider
      value={{
        selectedLM,
        selectedFunction,
        modelName,
        setSelectedLM,
        setSelectedFunction,
      }}
    >
      {children}
    </LMSettingsContext.Provider>
  );
};