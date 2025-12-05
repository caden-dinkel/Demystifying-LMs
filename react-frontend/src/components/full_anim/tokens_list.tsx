"use client";

import React from "react";

interface TokensListProps {
  tokens: string[];
  isVisible: boolean;
}

export const TokensList: React.FC<TokensListProps> = ({
  tokens,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div
      id="tokens"
      className="p-4 rounded-lg border-2 border-purple-500 bg-purple-50 transition-all duration-500"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(-20px)",
      }}
    >
      <div className="text-sm font-semibold text-purple-700 mb-2">
        Tokenized Input
      </div>
      <div className="flex flex-wrap gap-2">
        {tokens.map((token, idx) => (
          <span
            key={idx}
            className="px-2 py-1 bg-purple-200 text-purple-900 rounded text-sm font-mono border border-purple-300"
            style={{
              animationDelay: `${idx * 100}ms`,
              animation: "fadeInUp 0.5s ease-out forwards",
            }}
          >
            {token.replace(/\u0120/g, " ")}
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
