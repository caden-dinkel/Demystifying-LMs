import { ToolCall } from "@/utilities/types";
import { useState } from "react";

interface ToolCallDisplayProps {
  reasoning: string;
  toolCalls: ToolCall[];
  isExecuting: boolean;
}

export const ToolCallDisplay = ({
  reasoning,
  toolCalls,
  isExecuting,
}: ToolCallDisplayProps) => {
  const [expanded, setExpanded] = useState(true);

  if (!reasoning && toolCalls.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#f5f5f5",
        border: "2px solid #ddd",
        borderRadius: "8px",
        padding: "1rem",
        marginTop: "1rem",
        maxHeight: "400px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <h3 style={{ margin: 0, color: "#333" }}>LM Planner Output</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1.2rem",
          }}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>

      {expanded && (
        <>
          {/* Reasoning Section */}
          {reasoning && (
            <div
              style={{
                backgroundColor: "#fff",
                padding: "0.75rem",
                borderRadius: "4px",
                marginBottom: "1rem",
                border: "1px solid #e0e0e0",
              }}
            >
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  color: "#666",
                  marginBottom: "0.5rem",
                }}
              >
                Reasoning:
              </div>
              <div style={{ fontSize: "0.9rem", color: "#333" }}>
                {reasoning}
              </div>
            </div>
          )}

          {/* Tool Calls Section */}
          {toolCalls.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  color: "#666",
                  marginBottom: "0.5rem",
                }}
              >
                Tool Calls ({toolCalls.length}):
              </div>
              {toolCalls.map((toolCall, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#fff",
                    padding: "0.75rem",
                    borderRadius: "4px",
                    marginBottom: "0.5rem",
                    border: "1px solid #e0e0e0",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: "#007bff",
                          color: "white",
                          borderRadius: "50%",
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                        }}
                      >
                        {index + 1}
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: "bold",
                          color: "#007bff",
                        }}
                      >
                        {toolCall.tool_name}
                      </span>
                    </div>

                    {/* Success/Failure indicator */}
                    {toolCall.success !== undefined && (
                      <span
                        style={{
                          fontSize: "1.2rem",
                        }}
                      >
                        {toolCall.success ? "✅" : "❌"}
                      </span>
                    )}
                  </div>

                  {/* Arguments */}
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.85rem",
                      color: "#666",
                    }}
                  >
                    <strong>Arguments:</strong>
                    <pre
                      style={{
                        backgroundColor: "#f9f9f9",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        margin: "0.25rem 0 0 0",
                        fontSize: "0.8rem",
                        overflow: "auto",
                      }}
                    >
                      {JSON.stringify(toolCall.arguments, null, 2)}
                    </pre>
                  </div>

                  {/* Result (if available) */}
                  {toolCall.result !== undefined && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.85rem",
                        color: "#666",
                      }}
                    >
                      <strong>Result:</strong>
                      <div
                        style={{
                          backgroundColor: "#f0f7ff",
                          padding: "0.5rem",
                          borderRadius: "4px",
                          marginTop: "0.25rem",
                          fontSize: "0.85rem",
                        }}
                      >
                        {typeof toolCall.result === "string"
                          ? toolCall.result
                          : JSON.stringify(toolCall.result)}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  {toolCall.timestamp && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.75rem",
                        color: "#999",
                      }}
                    >
                      {new Date(toolCall.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Executing indicator */}
          {isExecuting && (
            <div
              style={{
                textAlign: "center",
                padding: "1rem",
                color: "#007bff",
                fontWeight: "bold",
              }}
            >
              Executing tool calls...
            </div>
          )}
        </>
      )}
    </div>
  );
};
