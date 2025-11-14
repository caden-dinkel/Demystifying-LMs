import { Room, Person } from "@/utilities/types";
import { DrawRoom } from "./room";
import { DrawPerson } from "./person";
import { useState, useEffect } from "react";

export interface SmartHomeProps {
  rooms: Room[];
  people: Person[];
  onRoomClick?: (room: Room) => void;
}

export const SmartHome = ({ rooms, people, onRoomClick }: SmartHomeProps) => {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  // Calculate person positions within their rooms
  const getPersonPosition = (person: Person) => {
    const room = rooms.find(
      (r) => r.id === person.location || r.name === person.location
    );
    if (!room) {
      return { x: person.x || 0, y: person.y || 0 };
    }

    // If person has explicit x, y coordinates, use them
    if (person.x !== undefined && person.y !== undefined) {
      return {
        x: room.bounds.leftX + person.x,
        y: room.bounds.topY + person.y,
      };
    }

    // Otherwise, center them in the room with some random offset
    const width = room.bounds.rightX - room.bounds.leftX;
    const height = room.bounds.bottomY - room.bounds.topY;
    return {
      x: room.bounds.leftX + width * 0.3 + Math.random() * width * 0.4,
      y: room.bounds.topY + height * 0.6 + Math.random() * height * 0.2,
    };
  };

  const handleHover = (roomName: string) => {
    setHoveredRoom(roomName);
  };

  return (
    <svg
      width="100%"
      height="600"
      viewBox="0 0 1000 600"
      style={{
        border: "2px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#fafafa",
      }}
    >
      {/* Rooms */}
      {rooms.map((room) => (
        <DrawRoom
          key={room.id}
          room={room}
          onHover={handleHover}
          onClick={onRoomClick}
        />
      ))}

      {/* People */}
      {people.map((person) => {
        const pos = getPersonPosition(person);
        return (
          <DrawPerson key={person.name} person={person} x={pos.x} y={pos.y} />
        );
      })}

      {/* Hover tooltip */}
      {hoveredRoom && (
        <text
          x="500"
          y="30"
          textAnchor="middle"
          fill="#333"
          fontSize="16"
          fontWeight="bold"
        >
          {hoveredRoom.replace(/_/g, " ")}
        </text>
      )}
    </svg>
  );
};
