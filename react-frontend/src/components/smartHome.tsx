import { Room, Person } from "@/api/types";
import { DrawRoom } from "./room";
import { useState } from "react";
export interface SmartHomeProps {
  rooms: Room[];
  people: Person[];
}

export const SmartHome = ({ rooms, people }: SmartHomeProps) => {
  //Want a little popup near room, maybe shows
  const [peopleLocations, setPeopleLocations] =
    useState<Map<string, string[]>>();
  const handleHover = (room: string) => {};

  const initializePeople = () => {
    //Might need to adjust this
    const initialLocations = people.map((person) => {
      const randIndex = Math.floor(Math.random() * rooms.length);
      return rooms[randIndex];
    });
  };

  return (
    <svg width="100%" height="80vh" viewBox="0 0 1000 800">
      {rooms.map((room) => (
        <DrawRoom
          room={room}
          color="rgba(144, 108, 112, 0.4)"
          onHover={handleHover}
        ></DrawRoom>
      ))}
    </svg>
  );
};
