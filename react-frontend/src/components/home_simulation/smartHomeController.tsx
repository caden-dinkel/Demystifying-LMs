import { useState } from "react";
import styles from "../../styles/home-simulation.module.css";

interface SmartHomeControllerProps {
  onExecuteCommand: (command: string) => Promise<void>;
  isExecuting: boolean;
}

const EXAMPLE_COMMANDS = [
  "Freeze Alice",
  "Make Bob comfortable",
  "Set bedroom to 72 degrees",
  "Make the kitchen warmer",
  "Cool down the bathroom",
  "Set living room to Alice's preferred temperature",
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
    <div className={styles.controllerContainer}>
      <h2 className={styles.controllerTitle}>Smart Home Controller</h2>

      {/* Command Input Form */}
      <form onSubmit={handleSubmit} className={styles.commandForm}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter a command (e.g., 'Freeze Alice' or 'Prepare living room for party')"
            disabled={isExecuting}
            className={styles.commandInput}
          />
          <button
            type="submit"
            disabled={isExecuting || !command.trim()}
            className={styles.submitButton}
          >
            {isExecuting ? "Running..." : "Execute"}
          </button>
        </div>
      </form>

      {/* Example Commands */}
      <div className={styles.examplesSection}>
        <div className={styles.examplesLabel}>Example Commands:</div>
        <div className={styles.examplesGrid}>
          {EXAMPLE_COMMANDS.map((exampleCommand, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(exampleCommand)}
              disabled={isExecuting}
              className={styles.exampleButton}
            >
              {exampleCommand}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className={styles.instructionsBox}>
        <strong>How it works:</strong> The language model receives complete
        information about the home state (where people are, their temperature
        preferences, and current room temperatures). It then decides how to
        adjust temperatures to keep everyone comfortable.
      </div>
    </div>
  );
};
