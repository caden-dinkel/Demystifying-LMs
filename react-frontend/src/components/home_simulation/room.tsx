import { Room } from "@/utilities/types";

interface RoomProps {
  room: Room;
  onHover?: (room: string) => void;
  onClick?: (room: Room) => void;
}

// Helper function to get temperature color (blue=cold, red=hot)
const getTempColor = (temp: number): string => {
  // Map 60-80°F to blue-red gradient
  const normalized = Math.max(0, Math.min(1, (temp - 60) / 20));

  if (normalized < 0.5) {
    // Blue to white (cold to neutral)
    const t = normalized * 2;
    const r = Math.round(173 + (255 - 173) * t);
    const g = Math.round(216 + (255 - 216) * t);
    const b = 230;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // White to red (neutral to hot)
    const t = (normalized - 0.5) * 2;
    const r = 255;
    const g = Math.round(255 - 100 * t);
    const b = Math.round(255 - 100 * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
};

export const DrawRoom = ({ room, onHover, onClick }: RoomProps) => {
  const tempColor = getTempColor(room.currentTemp);
  const width = room.bounds.rightX - room.bounds.leftX;
  const height = room.bounds.bottomY - room.bounds.topY;

  // Calculate center for text
  const centerX = room.bounds.leftX + width / 2;
  const centerY = room.bounds.topY + height / 2;

  return (
    <g>
      {/* Room rectangle with temperature color */}
      <rect
        key={room.id}
        x={room.bounds.leftX}
        y={room.bounds.topY}
        width={width}
        height={height}
        fill={tempColor}
        stroke="#333"
        strokeWidth="2"
        onMouseEnter={() => onHover?.(room.name)}
        onClick={() => onClick?.(room)}
        style={{ cursor: onClick ? "pointer" : "default" }}
      />

      {/* Light indicator (yellow glow in corner) */}
      {room.lightOn && (
        <circle
          cx={room.bounds.rightX - 15}
          cy={room.bounds.topY + 15}
          r="8"
          fill="#FFD700"
          stroke="#FFA500"
          strokeWidth="1"
        >
          <animate
            attributeName="opacity"
            values="0.6;1;0.6"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Room name */}
      <text
        x={centerX}
        y={centerY - 20}
        textAnchor="middle"
        fill="#333"
        fontSize="14"
        fontWeight="bold"
      >
        {room.name.replace(/_/g, " ")}
      </text>

      {/* Current temperature */}
      <text
        x={centerX}
        y={centerY + 5}
        textAnchor="middle"
        fill="#333"
        fontSize="24"
        fontWeight="bold"
      >
        {Math.round(room.currentTemp)}°F
      </text>

      {/* Target temperature (if different) */}
      {Math.abs(room.currentTemp - room.targetTemp) > 0.5 && (
        <>
          <text
            x={centerX}
            y={centerY + 25}
            textAnchor="middle"
            fill="#666"
            fontSize="12"
          >
            → {Math.round(room.targetTemp)}°F
          </text>

          {/* HVAC indicator */}
          {room.hvacMode !== "off" && (
            <text
              x={centerX}
              y={centerY + 40}
              textAnchor="middle"
              fill={room.hvacMode === "heat" ? "#FF6B6B" : "#4ECDC4"}
              fontSize="12"
            >
              {room.hvacMode === "heat" ? "↑ HEATING" : "↓ COOLING"}
            </text>
          )}
        </>
      )}
    </g>
  );
};
