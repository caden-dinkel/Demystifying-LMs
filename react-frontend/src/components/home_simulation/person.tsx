import { Person } from "@/utilities/types";

export interface DrawPersonProps {
  person: Person;
  x: number;
  y: number;
}

export const DrawPerson = ({ person, x, y }: DrawPersonProps) => {
  // Color based on comfort level
  const comfortColor = person.comfortable ? "#4CAF50" : "#F44336";
  const pulseAnimation = person.comfortable ? "none" : "pulse";

  return (
    <g>
      {/* Person circle */}
      <circle
        cx={x}
        cy={y}
        r="15"
        fill={comfortColor}
        stroke="#333"
        strokeWidth="2"
        opacity="0.9"
      >
        {!person.comfortable && (
          <animate
            attributeName="r"
            values="15;18;15"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* Person initial */}
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontWeight="bold"
      >
        {person.name.charAt(0).toUpperCase()}
      </text>

      {/* Name label */}
      <text
        x={x}
        y={y + 30}
        textAnchor="middle"
        fill="#333"
        fontSize="12"
        fontWeight="bold"
      >
        {person.name}
      </text>

      {/* Preferred temperature tooltip */}
      <text x={x} y={y + 45} textAnchor="middle" fill="#666" fontSize="10">
        Prefers {person.preferredTemp}°F
      </text>

      {/* Comfort indicator */}
      {!person.comfortable && (
        <text x={x} y={y - 25} textAnchor="middle" fill="#F44336" fontSize="18">
          ⚠️
        </text>
      )}
    </g>
  );
};
