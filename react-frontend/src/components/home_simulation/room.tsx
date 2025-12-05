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
        stroke="hsl(var(--border))"
        strokeWidth="3"
        onMouseEnter={() => onHover?.(room.name)}
        onClick={() => onClick?.(room)}
        style={{ cursor: onClick ? "pointer" : "default" }}
      />

      {/* Room name */}
      <text
        x={centerX}
        y={centerY - 30}
        textAnchor="middle"
        fill="#000000"
        fontSize="22"
        fontWeight="bold"
        stroke="#000000"
        strokeWidth="0.5"
      >
        {room.name
          .replace(/_/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")}
      </text>

      {/* Current temperature */}
      <text
        x={centerX}
        y={centerY + 10}
        textAnchor="middle"
        fill="#000000"
        fontSize="48"
        fontWeight="bold"
        stroke="#000000"
        strokeWidth="0.5"
      >
        {Math.round(room.currentTemp)}°F
      </text>

      {/* Target temperature (if different) */}
      {Math.abs(room.currentTemp - room.targetTemp) > 0.5 && (
        <>
          <text
            x={centerX}
            y={centerY + 45}
            textAnchor="middle"
            fill="#333333"
            fontSize="18"
            stroke="#333333"
            strokeWidth="0.3"
          >
            → {Math.round(room.targetTemp)}°F
          </text>

          {/* HVAC indicator */}
          {room.hvacMode !== "off" && (
            <text
              x={centerX}
              y={centerY + 70}
              textAnchor="middle"
              fill={room.hvacMode === "heat" ? "#CC0000" : "#006666"}
              fontSize="18"
              fontWeight="bold"
            >
              {room.hvacMode === "heat" ? "↑ HEATING" : "↓ COOLING"}
            </text>
          )}
        </>
      )}
    </g>
  );
};
