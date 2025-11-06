import { Room } from "@/utilities/types";

interface RoomProps {
  room: Room;
  color: string; //'rgba(r,g,b,a)'
  onHover: (room: string) => void;
}

export const DrawRoom = ({ room, color, onHover }: RoomProps) => {
  return (
    <rect
      key={room.id}
      x={room.bounds.leftX}
      y={room.bounds.topY}
      width={room.bounds.rightX - room.bounds.leftX}
      height={room.bounds.bottomY - room.bounds.topY}
      fill={color}
      stroke="#333"
      strokeWidth="2"
      onMouseEnter={() => onHover(room.name)}
    />
  );
};
