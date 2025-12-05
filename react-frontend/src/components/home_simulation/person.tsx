import { Person } from "@/utilities/types";

export interface DrawPersonProps {
  person: Person;
  x: number;
  y: number;
  onDragStart?: (person: Person, event: React.MouseEvent) => void;
}

export const DrawPerson = ({ person, x, y, onDragStart }: DrawPersonProps) => {
  // Color based on comfort level - using global CSS colors
  const comfortColor = person.comfortable
    ? "hsl(var(--chart-2))"
    : "hsl(var(--destructive))";

  return (
    <g
      opacity="0.6"
      style={{ cursor: "grab" }}
      onMouseDown={(e) => onDragStart?.(person, e as any)}
    >
      {/* Person shadow silhouette */}
      <ellipse
        cx={x}
        cy={y}
        rx="35"
        ry="15"
        fill={comfortColor}
        stroke="hsl(var(--border))"
        strokeWidth="2"
      >
        {!person.comfortable && (
          <animate
            attributeName="opacity"
            values="0.6;0.8;0.6"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </ellipse>

      {/* Person head (part of shadow) */}
      <circle
        cx={x}
        cy={y - 20}
        r="18"
        fill={comfortColor}
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />

      {/* Person initial in the head */}
      <text
        x={x}
        y={y - 15}
        textAnchor="middle"
        fill="hsl(var(--background))"
        fontSize="20"
        fontWeight="bold"
      >
        {person.name.charAt(0).toUpperCase()}
      </text>

      {/* Name label to the left of icon */}
      <text
        x={x - 50}
        y={y - 10}
        textAnchor="end"
        fill="#000000"
        fontSize="18"
        fontWeight="bold"
        stroke="#000000"
        strokeWidth="0.3"
      >
        {person.name}
      </text>

      {/* Preferred temperature tooltip next to name */}
      <text x={x - 50} y={y + 8} textAnchor="end" fill="#333333" fontSize="14">
        Prefers {person.preferredTemp}°F
      </text>

      {/* Comfort indicator */}
      {!person.comfortable && (
        <text
          x={x}
          y={y - 45}
          textAnchor="middle"
          fill="hsl(var(--destructive))"
          fontSize="24"
        >
          ⚠️
        </text>
      )}
    </g>
  );
};
