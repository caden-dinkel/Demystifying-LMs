import { useState } from "react";

interface SmartHomeControllerProps {
  onExecuteCommand: (command: string) => Promise<void>;
  isExecuting: boolean;
}

const EXAMPLE_COMMANDS = [
  "Freeze Alice",
  "Make Bob comfortable",
  "Prepare the living room for a party",
  "Turn off all lights",
  "Set bedroom to 72 degrees",
  "What temperature is the kitchen?",
];

export const SmartHomeController = ({
  onExecuteCommand,
  isExecuting,
}: SmartHomeControllerProps) => {
  const [command, setCommand] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !isExecuting) {
      await onExecuteCommand(command.trim());
    }
  };

  const handleExampleClick = async (exampleCommand: string) => {
    if (!isExecuting) {
      setCommand(exampleCommand);
      await onExecuteCommand(exampleCommand);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "2px solid #ddd",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1rem",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "1rem", color: "#333" }}>
        Smart Home Controller
      </h2>

      {/* Command Input Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter a command (e.g., 'Freeze Alice' or 'Prepare living room for party')"
            disabled={isExecuting}
            style={{
              flex: 1,
              padding: "0.75rem",
              fontSize: "1rem",
              border: "2px solid #ddd",
              borderRadius: "4px",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#007bff")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
          <button
            type="submit"
            disabled={isExecuting || !command.trim()}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: isExecuting ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                isExecuting || !command.trim() ? "not-allowed" : "pointer",
              fontWeight: "bold",
              minWidth: "120px",
            }}
          >
            {isExecuting ? "Running..." : "Execute"}
          </button>
        </div>
      </form>

      {/* Example Commands */}
      <div>
        <div
          style={{
            fontSize: "0.85rem",
            fontWeight: "bold",
            color: "#666",
            marginBottom: "0.5rem",
          }}
        >
          Example Commands:
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          {EXAMPLE_COMMANDS.map((exampleCommand, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(exampleCommand)}
              disabled={isExecuting}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.85rem",
                backgroundColor: "#f5f5f5",
                color: "#333",
                border: "1px solid #ddd",
                borderRadius: "20px",
                cursor: isExecuting ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isExecuting) {
                  e.currentTarget.style.backgroundColor = "#e0e0e0";
                  e.currentTarget.style.borderColor = "#007bff";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
                e.currentTarget.style.borderColor = "#ddd";
              }}
            >
              {exampleCommand}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: "1rem",
          padding: "0.75rem",
          backgroundColor: "#f0f7ff",
          borderRadius: "4px",
          fontSize: "0.85rem",
          color: "#666",
        }}
      >
        <strong>How it works:</strong> The language model will analyze your
        command, decide which tools to use, and generate a plan to control the
        smart home. Watch as it adjusts temperatures, controls lights, and
        manages the environment!
      </div>
    </div>
  );
};
