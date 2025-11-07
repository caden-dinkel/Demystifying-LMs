// Assuming you moved your .textarea style to a CSS module
import styles from "@/styles/textbox.module.css";

// Define props for the component
interface TextareaInputProps {
  value: string; //current text value
  placeholder?: string;
  // Handler to send the text back to the parent component
  onTextChange: (text: string) => void;
  disabled?: boolean;
}

export const TextareaInput: React.FC<TextareaInputProps> = ({
  value,
  placeholder = "Enter your text here...",
  onTextChange,
  disabled = false,
}) => {
  return (
    <div className={styles.container}>
      <label htmlFor="user-input">Text to Analyze:</label>
      <textarea
        id="user-input"
        className={styles.textarea} // Apply your module-scoped styles
        value={value} // **Controlled Component:** Value is tied to state
        onChange={(e) => onTextChange(e.target.value)} // **Controlled Component:** Updates state on change
        placeholder={placeholder}
        rows={1} // Set a default visible height
        disabled={disabled}
      />
    </div>
  );
};
