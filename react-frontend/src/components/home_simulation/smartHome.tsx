import { Room, Person } from "@/utilities/types";
import { DrawRoom } from "./room";
import { DrawPerson } from "./person";
import { useState, useEffect, useRef } from "react";

export interface SmartHomeProps {
  rooms: Room[];
  people: Person[];
  onRoomClick?: (room: Room) => void;
  onPersonMove?: (personName: string, newRoomId: string) => void;
}

export const SmartHome = ({
  rooms,
  people,
  onRoomClick,
  onPersonMove,
}: SmartHomeProps) => {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [draggedPerson, setDraggedPerson] = useState<Person | null>(null);
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate person positions within their rooms
  const getPersonPosition = (person: Person) => {
    const room = rooms.find(
      (r) => r.id === person.location || r.name === person.location
    );
    if (!room) {
      return { x: person.x || 0, y: person.y || 0 };
    }

    // Count how many people are in this room and this person's index
    const peopleInRoom = people.filter(
      (p) => p.location === room.id || p.location === room.name
    );
    const personIndex = peopleInRoom.findIndex((p) => p.name === person.name);

    const width = room.bounds.rightX - room.bounds.leftX;
    const height = room.bounds.bottomY - room.bounds.topY;

    // Base position in bottom-right corner
    const baseX = room.bounds.leftX + width * 0.85;
    const baseY = room.bounds.topY + height * 0.85;

    // If only one person, use base position
    if (peopleInRoom.length === 1) {
      return { x: baseX, y: baseY };
    }

    // If multiple people, keep first person on right and shift others to the left
    const spacing = 200; // Distance to shift each additional person to the left

    return {
      x: baseX - spacing * personIndex,
      y: baseY,
    };
  };

  const handleHover = (roomName: string) => {
    setHoveredRoom(roomName);
  };

  const handleDragStart = (person: Person, event: React.MouseEvent) => {
    setDraggedPerson(person);
    const svg = svgRef.current;
    if (svg) {
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      setDragPosition({ x: svgP.x, y: svgP.y });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (draggedPerson && svgRef.current) {
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      setDragPosition({ x: svgP.x, y: svgP.y });
    }
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    if (draggedPerson && dragPosition && svgRef.current) {
      // Find which room the person was dropped in
      const droppedRoom = rooms.find((room) => {
        return (
          dragPosition.x >= room.bounds.leftX &&
          dragPosition.x <= room.bounds.rightX &&
          dragPosition.y >= room.bounds.topY &&
          dragPosition.y <= room.bounds.bottomY
        );
      });

      if (droppedRoom && onPersonMove) {
        onPersonMove(draggedPerson.name, droppedRoom.id);
      }
    }
    setDraggedPerson(null);
    setDragPosition(null);
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="600px"
      viewBox="0 0 1200 800"
      style={{
        border: "2px solid hsl(var(--border))",
        borderRadius: "8px",
        backgroundColor: "hsl(var(--muted))",
        cursor: draggedPerson ? "grabbing" : "default",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
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
        // If this person is being dragged, use drag position
        const pos =
          draggedPerson?.name === person.name && dragPosition
            ? dragPosition
            : getPersonPosition(person);
        return (
          <DrawPerson
            key={person.name}
            person={person}
            x={pos.x}
            y={pos.y}
            onDragStart={handleDragStart}
          />
        );
      })}

      {/* Hover tooltip */}
      {hoveredRoom && (
        <text
          x="600"
          y="20"
          textAnchor="middle"
          fill="hsl(var(--foreground))"
          fontSize="20"
          fontWeight="bold"
        >
          {hoveredRoom
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </text>
      )}
    </svg>
  );
};
