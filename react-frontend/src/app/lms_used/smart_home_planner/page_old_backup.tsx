"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { SmartHome } from "@/components/home_simulation/smartHome";
import { SmartHomeController } from "@/components/home_simulation/smartHomeController";
import { ToolCallDisplay } from "@/components/home_simulation/toolCallDisplay";
import { Room, Person, HomeState, ToolCall, Waypoint } from "@/utilities/types";
import { executePlanner } from "@/api/plannerClient";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import Navbar from "@/components/navigation/navBar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import styles from "@/styles/main-layout.module.css";

// Initial room layout - scaled for larger visualization (1200x800 viewBox)
const INITIAL_ROOMS: Room[] = [
  {
    id: "living_room",
    name: "living_room",
    bounds: { leftX: 50, topY: 50, rightX: 575, bottomY: 375 },
    currentTemp: 72,
    targetTemp: 72,
    hvacMode: "off",
  },
  {
    id: "kitchen",
    name: "kitchen",
    bounds: { leftX: 625, topY: 50, rightX: 1150, bottomY: 375 },
    currentTemp: 70,
    targetTemp: 70,
    hvacMode: "off",
  },
  {
    id: "bedroom",
    name: "bedroom",
    bounds: { leftX: 50, topY: 425, rightX: 575, bottomY: 750 },
    currentTemp: 68,
    targetTemp: 68,
    hvacMode: "off",
  },
  {
    id: "bathroom",
    name: "bathroom",
    bounds: { leftX: 625, topY: 425, rightX: 1150, bottomY: 750 },
    currentTemp: 74,
    targetTemp: 74,
    hvacMode: "off",
  },
];

// Generate waypoints for people to follow - avoiding center where temp is displayed
const generateWaypoints = (rooms: Room[], startTime: number): Waypoint[] => {
  const waypoints: Waypoint[] = [];
  const roomIds = rooms.map((r) => r.id);

  // Create a path through different rooms
  const path = [
    { roomId: "bedroom", duration: 5000 },
    { roomId: "bathroom", duration: 3000 },
    { roomId: "kitchen", duration: 4000 },
    { roomId: "living_room", duration: 6000 },
    { roomId: "bedroom", duration: 5000 },
  ];

  let currentTime = startTime;
  path.forEach((step) => {
    const room = rooms.find((r) => r.id === step.roomId);
    if (room) {
      const width = room.bounds.rightX - room.bounds.leftX;
      const height = room.bounds.bottomY - room.bounds.topY;

      currentTime += step.duration;

      // Position people in corners/edges to avoid covering center temperature text
      // Choose random corner/edge position
      const positions = [
        { x: width * 0.2, y: height * 0.2 }, // Top-left
        { x: width * 0.8, y: height * 0.2 }, // Top-right
        { x: width * 0.2, y: height * 0.8 }, // Bottom-left
        { x: width * 0.8, y: height * 0.8 }, // Bottom-right
      ];
      const position = positions[Math.floor(Math.random() * positions.length)];

      waypoints.push({
        roomId: step.roomId,
        x: position.x,
        y: position.y,
        arrivalTime: currentTime,
      });
    }
  });

  return waypoints;
};

// Initial people - simple starting positions
const createInitialPeople = (): Person[] => {
  return [
    {
      name: "Alice",
      location: "bedroom",
      preferredTemp: 70,
      comfortable: true,
    },
    {
      name: "Bob",
      location: "living_room",
      preferredTemp: 68,
      comfortable: true,
    },
  ];
};

export default function SmartHomePlannerPage() {
  const { selectedLM } = useLMSettings();
  const [homeState, setHomeState] = useState<HomeState>({
    rooms: INITIAL_ROOMS,
    people: createInitialPeople(),
    history: [],
  });

  const [reasoning, setReasoning] = useState("");
  const [currentToolCalls, setCurrentToolCalls] = useState<ToolCall[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Update comfort status based on room temperature
  useEffect(() => {
    setHomeState((prev) => ({
      ...prev,
      people: prev.people.map((person) => {
        const room = prev.rooms.find(
          (r) => r.id === person.location || r.name === person.location
        );
        if (!room) return person;

        // Person is comfortable if room temp is within 3 degrees of preference
        const comfortable =
          Math.abs(room.currentTemp - person.preferredTemp) <= 3;
        return { ...person, comfortable };
      }),
    }));
  }, [homeState.rooms]);

  // Handle manual person movement (drag and drop)
  const handlePersonMove = useCallback((personName: string, newRoomId: string) => {
    setHomeState((prev) => ({
      ...prev,
      people: prev.people.map((person) =>
        person.name === personName
          ? { ...person, location: newRoomId }
          : person
      ),
    }));
  }, []);

  // Handle manual temperature change
  const handleTemperatureChange = useCallback((roomId: string, newTemp: number) => {
    setHomeState((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id === roomId
          ? { ...room, currentTemp: newTemp, targetTemp: newTemp }
          : room
      ),
    }));
  }, []);

        // Person is comfortable if room temp is within 3 degrees of preference
        const comfortable =
          Math.abs(room.currentTemp - person.preferredTemp) <= 3;
        return { ...person, comfortable };
      }),
    }));
  }, [homeState.rooms]);

  // Execute a single tool call and update state
  const executeToolCall = useCallback(
    async (toolCall: ToolCall): Promise<ToolCall> => {
      const { tool_name, arguments: args } = toolCall;

      try {
        switch (tool_name) {
          case "set_room_temperature": {
            const { room_name, temperature } = args;

            // Get the current temperature BEFORE any state updates
            const room = homeState.rooms.find(
              (r) => r.name === room_name || r.id === room_name
            );

            if (!room) {
              return {
                ...toolCall,
                success: false,
                result: `Room ${room_name} not found`,
                timestamp: Date.now(),
              };
            }

            const startTemp = room.currentTemp;
            const tempDiff = temperature - startTemp;

            // Set target temp and HVAC mode immediately
            setHomeState((prev) => ({
              ...prev,
              rooms: prev.rooms.map((r) =>
                r.name === room_name || r.id === room_name
                  ? {
                      ...r,
                      targetTemp: temperature,
                      hvacMode:
                        temperature > startTemp
                          ? "heat"
                          : temperature < startTemp
                          ? "cool"
                          : "off",
                    }
                  : r
              ),
            }));

            // Animate temperature change
            const steps = 10;
            const delay = 100;
            const increment = tempDiff / steps;

            for (let i = 1; i <= steps; i++) {
              await new Promise((resolve) => setTimeout(resolve, delay));
              const newTemp = startTemp + increment * i;
              setHomeState((prev) => ({
                ...prev,
                rooms: prev.rooms.map((r) =>
                  r.name === room_name || r.id === room_name
                    ? {
                        ...r,
                        currentTemp: newTemp,
                      }
                    : r
                ),
              }));
            }

            // Final update to exact temperature and turn off HVAC
            setHomeState((prev) => ({
              ...prev,
              rooms: prev.rooms.map((r) =>
                r.name === room_name || r.id === room_name
                  ? {
                      ...r,
                      currentTemp: temperature,
                      hvacMode: "off",
                    }
                  : r
              ),
            }));

            return {
              ...toolCall,
              success: true,
              result: `Set ${room_name} temperature to ${temperature}°F`,
              timestamp: Date.now(),
            };
          }

          default:
            return {
              ...toolCall,
              success: false,
              result: `Unknown tool: ${tool_name}`,
              timestamp: Date.now(),
            };
        }
      } catch (error) {
        return {
          ...toolCall,
          success: false,
          result: `Error: ${error}`,
          timestamp: Date.now(),
        };
      }
    },
    [homeState.rooms, homeState.people]
  );

  // Sequential animation controller
  const runAnimationCycle = useCallback(async () => {
    // Phase 1: Observing current state
    setPhase("observing");
    setReasoning("Observing current home state...");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Phase 2: Calling LM
    setPhase("calling_lm");
    setReasoning("Calling language model to assess situation...");

    try {
      const prompt =
        "Assess the current smart home state. Keep all people comfortable by adjusting temperatures and lights as needed. Generate ONE command to improve comfort.";

      const response = await executePlanner(prompt, selectedLM, homeState);

      if (response.error) {
        console.error("Planner error:", response.error);
        setReasoning(`Error: ${response.error}`);
        setPhase("idle");
        return;
      }

      // Phase 3: Showing plan
      setPhase("showing_plan");
      setReasoning(response.reasoning);

      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolCall = response.tool_calls[0];
        setCurrentToolCalls([toolCall]);
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Phase 4: Executing
        setPhase("executing");
        const result = await executeToolCall(toolCall);
        setCurrentToolCalls([result]);

        setHomeState((prev) => ({
          ...prev,
          history: [...prev.history, result],
        }));

        // Phase 5: Observing changes
        setPhase("observing_changes");
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Phase 6: Moving people
        setPhase("moving_people");
        setReasoning("People are moving to different rooms...");
        movePeopleToNextWaypoint();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error("Error in animation cycle:", error);
      setReasoning(`Error: ${error}`);
      setPhase("idle");
    }
  }, [selectedLM, homeState, executeToolCall, movePeopleToNextWaypoint]);

  // Main animation loop
  useEffect(() => {
    if (!isAnimating) {
      setPhase("idle");
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
      }
      return;
    }

    const runLoop = async () => {
      while (isAnimating) {
        await runAnimationCycle();
      }
    };

    runLoop();

    return () => {
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
      }
    };
  }, [isAnimating, runAnimationCycle]);

  return (
    <>
      <Navbar />
      <main className={styles.baseMain}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              LM as Planner: Smart Home Demo
            </h1>
            <p className="text-muted-foreground mt-2">
              Watch as the language model continuously monitors the smart home
              and keeps people comfortable as they move between rooms.
            </p>
          </div>

          {/* Smart Home Visualization - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle>Home Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <SmartHome rooms={homeState.rooms} people={homeState.people} />

              {/* Legend */}
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <div>
                  <strong>Temperature:</strong> Blue (cold) → White → Red (hot)
                </div>
                <div>
                  <strong>People:</strong> Green (Comfortable) | Red
                  (Uncomfortable)
                </div>
                <div>
                  <strong>HVAC:</strong> ↑ HEATING (red) | ↓ COOLING (blue)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Animation Controls and Tool Calls - Below */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Animation Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Animation Controls</CardTitle>
                <CardDescription>
                  {phase === "idle" && "Click to start the simulation"}
                  {phase === "observing" && "Observing current state..."}
                  {phase === "calling_lm" && "Calling language model..."}
                  {phase === "showing_plan" && "LM has made a decision"}
                  {phase === "executing" && "Executing command..."}
                  {phase === "observing_changes" && "Observing changes..."}
                  {phase === "moving_people" && "People moving..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setIsAnimating(!isAnimating)}
                  className="w-full"
                  variant={isAnimating ? "destructive" : "default"}
                  disabled={phase === "executing" || phase === "calling_lm"}
                >
                  {isAnimating ? "Stop Animation" : "Start Animation"}
                </Button>
              </CardContent>
            </Card>

            {/* Tool Calls Display */}
            <ToolCallDisplay
              reasoning={reasoning}
              toolCalls={currentToolCalls}
              isExecuting={phase === "executing" || phase === "calling_lm"}
            />
          </div>
        </div>
      </main>
    </>
  );
}
