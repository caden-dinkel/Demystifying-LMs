"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { SmartHome } from "@/components/home_simulation/smartHome";
import { SmartHomeController } from "@/components/home_simulation/smartHomeController";
import { ToolCallDisplay } from "@/components/home_simulation/toolCallDisplay";
import { Room, Person, HomeState, ToolCall, Waypoint } from "@/utilities/types";
import { executePlanner } from "@/api/plannerClient";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import Navbar from "@/components/navigation/navBar";

// Initial room layout
const INITIAL_ROOMS: Room[] = [
  {
    id: "living_room",
    name: "living_room",
    bounds: { leftX: 50, topY: 50, rightX: 450, bottomY: 300 },
    currentTemp: 72,
    targetTemp: 72,
    lightOn: true,
    hvacMode: "off",
  },
  {
    id: "kitchen",
    name: "kitchen",
    bounds: { leftX: 500, topY: 50, rightX: 750, bottomY: 300 },
    currentTemp: 70,
    targetTemp: 70,
    lightOn: true,
    hvacMode: "off",
  },
  {
    id: "bedroom",
    name: "bedroom",
    bounds: { leftX: 50, topY: 350, rightX: 450, bottomY: 550 },
    currentTemp: 68,
    targetTemp: 68,
    lightOn: false,
    hvacMode: "off",
  },
  {
    id: "bathroom",
    name: "bathroom",
    bounds: { leftX: 500, topY: 350, rightX: 750, bottomY: 550 },
    currentTemp: 74,
    targetTemp: 74,
    lightOn: false,
    hvacMode: "off",
  },
];

// Generate waypoints for people to follow
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
      waypoints.push({
        roomId: step.roomId,
        x: width * 0.3 + Math.random() * width * 0.4,
        y: height * 0.3 + Math.random() * height * 0.4,
        arrivalTime: currentTime,
      });
    }
  });

  return waypoints;
};

// Initial people with waypoints
const createInitialPeople = (rooms: Room[]): Person[] => {
  const startTime = Date.now();
  return [
    {
      name: "Alice",
      location: "bedroom",
      preferredTemp: 70,
      x: 150,
      y: 80,
      comfortable: true,
      waypoints: generateWaypoints(rooms, startTime),
      currentWaypointIndex: 0,
    },
    {
      name: "Bob",
      location: "living_room",
      preferredTemp: 68,
      x: 200,
      y: 120,
      comfortable: true,
      waypoints: generateWaypoints(rooms, startTime + 2000),
      currentWaypointIndex: 0,
    },
  ];
};

type AnimationPhase =
  | "idle"
  | "observing" // Show current state
  | "calling_lm" // LM is being called
  | "showing_plan" // Display LM's decision
  | "executing" // Execute tools
  | "observing_changes" // Pause to see the effects
  | "moving_people"; // People move to new locations

export default function SmartHomePlannerPage() {
  const { selectedLM } = useLMSettings();
  const [homeState, setHomeState] = useState<HomeState>({
    rooms: INITIAL_ROOMS,
    people: createInitialPeople(INITIAL_ROOMS),
    history: [],
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [phase, setPhase] = useState<AnimationPhase>("idle");
  const [reasoning, setReasoning] = useState("");
  const [currentToolCalls, setCurrentToolCalls] = useState<ToolCall[]>([]);
  const animationLoopRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const peopleMovementRef = useRef<NodeJS.Timeout | null>(null);

  // Move people to next waypoint
  const movePeopleToNextWaypoint = useCallback(() => {
    const now = Date.now();
    setHomeState((prev) => ({
      ...prev,
      people: prev.people.map((person) => {
        if (!person.waypoints || person.waypoints.length === 0) return person;

        const currentIdx = person.currentWaypointIndex || 0;
        const nextIdx = (currentIdx + 1) % person.waypoints.length;
        const nextWaypoint = person.waypoints[nextIdx];

        // If we've looped back, generate new waypoints
        if (nextIdx === 0) {
          return {
            ...person,
            location: nextWaypoint.roomId,
            x: nextWaypoint.x,
            y: nextWaypoint.y,
            currentWaypointIndex: 0,
            waypoints: generateWaypoints(prev.rooms, now),
          };
        }

        return {
          ...person,
          location: nextWaypoint.roomId,
          x: nextWaypoint.x,
          y: nextWaypoint.y,
          currentWaypointIndex: nextIdx,
        };
      }),
    }));
  }, []);

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

  // Execute a single tool call and update state
  const executeToolCall = useCallback(
    async (toolCall: ToolCall): Promise<ToolCall> => {
      const { tool_name, arguments: args } = toolCall;

      try {
        switch (tool_name) {
          case "set_room_temperature": {
            const { room_name, temperature } = args;
            setHomeState((prev) => ({
              ...prev,
              rooms: prev.rooms.map((room) =>
                room.name === room_name || room.id === room_name
                  ? {
                      ...room,
                      targetTemp: temperature,
                      hvacMode:
                        temperature > room.currentTemp
                          ? "heat"
                          : temperature < room.currentTemp
                          ? "cool"
                          : "off",
                    }
                  : room
              ),
            }));

            // Animate temperature change
            const steps = 10;
            const delay = 100;
            const room = homeState.rooms.find(
              (r) => r.name === room_name || r.id === room_name
            );
            if (room) {
              const tempDiff = temperature - room.currentTemp;
              const increment = tempDiff / steps;

              for (let i = 1; i <= steps; i++) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                setHomeState((prev) => ({
                  ...prev,
                  rooms: prev.rooms.map((r) =>
                    r.name === room_name || r.id === room_name
                      ? {
                          ...r,
                          currentTemp: room.currentTemp + increment * i,
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
            }

            return {
              ...toolCall,
              success: true,
              result: `Set ${room_name} temperature to ${temperature}°F`,
              timestamp: Date.now(),
            };
          }

          case "set_room_light": {
            const { room_name, state } = args;
            setHomeState((prev) => ({
              ...prev,
              rooms: prev.rooms.map((room) =>
                room.name === room_name || room.id === room_name
                  ? { ...room, lightOn: state }
                  : room
              ),
            }));
            return {
              ...toolCall,
              success: true,
              result: `Turned ${state ? "on" : "off"} lights in ${room_name}`,
              timestamp: Date.now(),
            };
          }

          case "get_person_location": {
            const { person_name } = args;
            const person = homeState.people.find((p) => p.name === person_name);
            if (!person) {
              return {
                ...toolCall,
                success: false,
                result: `Person ${person_name} not found`,
                timestamp: Date.now(),
              };
            }
            return {
              ...toolCall,
              success: true,
              result: `${person_name} is in ${person.location}`,
              timestamp: Date.now(),
            };
          }

          case "get_room_status": {
            const { room_name } = args;
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
            const occupants = homeState.people
              .filter((p) => p.location === room_name || p.location === room.id)
              .map((p) => p.name);
            return {
              ...toolCall,
              success: true,
              result: `${room_name}: ${room.currentTemp}°F, light ${
                room.lightOn ? "on" : "off"
              }, occupants: ${occupants.join(", ") || "none"}`,
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
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <Navbar />
      <h1 style={{ marginBottom: "0.5rem" }}>LM as Planner: Smart Home Demo</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Watch as the language model continuously monitors the smart home and
        keeps people comfortable as they move between rooms.
      </p>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
      >
        {/* Left Column: Animation Controls and Tool Calls */}
        <div>
          {/* Animation Controls */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "2px solid #ddd",
              borderRadius: "8px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>
              Animation Controls
            </h3>
            <button
              onClick={() => setIsAnimating(!isAnimating)}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                fontWeight: "600",
                color: "#fff",
                backgroundColor: isAnimating ? "#ef4444" : "#3b82f6",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                width: "100%",
                transition: "background-color 0.2s",
              }}
              disabled={phase === "executing" || phase === "calling_lm"}
            >
              {isAnimating ? "Stop Animation" : "Start Animation"}
            </button>
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.875rem",
                color: "#666",
                textAlign: "center",
              }}
            >
              {phase === "idle" && "Click to start the simulation"}
              {phase === "observing" && "Observing current state..."}
              {phase === "calling_lm" && "Calling language model..."}
              {phase === "showing_plan" && "LM has made a decision"}
              {phase === "executing" && "Executing command..."}
              {phase === "observing_changes" && "Observing changes..."}
              {phase === "moving_people" && "People moving..."}
            </p>
          </div>

          <ToolCallDisplay
            reasoning={reasoning}
            toolCalls={currentToolCalls}
            isExecuting={phase === "executing" || phase === "calling_lm"}
          />
        </div>

        {/* Right Column: Smart Home Visualization */}
        <div>
          <div
            style={{
              backgroundColor: "#fff",
              border: "2px solid #ddd",
              borderRadius: "8px",
              padding: "1rem",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>Home Layout</h3>
            <SmartHome rooms={homeState.rooms} people={homeState.people} />

            {/* Legend */}
            <div
              style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#666" }}
            >
              <div>
                <strong>Temperature:</strong> Blue (cold) → White → Red (hot)
              </div>
              <div>
                <strong>People:</strong> Green (Comfortable) | Red
                (Uncomfortable)
              </div>
              <div>
                <strong>Lights:</strong> Yellow glow when on
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
