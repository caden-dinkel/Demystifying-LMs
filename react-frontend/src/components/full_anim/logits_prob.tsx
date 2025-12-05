"use client";

import React from "react";

interface LogitsProbProps {
  tokens: string[];
  probabilities: number[];
  isVisible: boolean;
}

export const LogitsProb: React.FC<LogitsProbProps> = ({
  tokens,
  probabilities,
  isVisible,
}) => {
  if (!isVisible || tokens.length === 0) return null;

  return (
    <div
      id="logits"
      className="p-4 rounded-lg border-2 border-orange-500 bg-orange-50 transition-all duration-500"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateX(0)" : "translateX(-20px)",
      }}
    >
      <div className="text-sm font-semibold text-orange-700 mb-3">
        Token Probabilities
      </div>
      <div className="space-y-2">
        {tokens.slice(0, 5).map((token, idx) => {
          const prob = probabilities[idx];
          const percentage = (prob * 100).toFixed(1);

          return (
            <div
              key={idx}
              className="flex items-center gap-2"
              style={{
                animationDelay: `${idx * 100}ms`,
                animation: "fadeIn 0.5s ease-out forwards",
                opacity: 0,
              }}
            >
              <div className="w-20 text-xs font-mono text-orange-900 truncate">
                {token.replace(/\u0120/g, " ")}
              </div>
              <div className="flex-1 h-6 bg-orange-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-1000"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-12 text-xs text-orange-700 text-right">
                {percentage}%
              </div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
