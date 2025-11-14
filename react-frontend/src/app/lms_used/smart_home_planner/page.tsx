"use client";

import { useState, useCallback, useEffect } from "react";
import { SmartHome } from "@/components/home_simulation/smartHome";
import { ToolCallDisplay } from "@/components/home_simulation/toolCallDisplay";
import { Room, Person, HomeState, ToolCall } from "@/utilities/types";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "@/styles/main-layout.module.css";

// Initial room layout - scaled for larger visualization (1200x800 viewBox)
const INITIAL_ROOMS: Room[] = [
  {
    id: "living_room",
    name: "living_room",
    bounds: { leftX: 50, topY: 20, rightX: 575, bottomY: 390 },
    currentTemp: 72,
    targetTemp: 72,
    hvacMode: "off",
  },
  {
    id: "kitchen",
    name: "kitchen",
    bounds: { leftX: 625, topY: 20, rightX: 1150, bottomY: 390 },
    currentTemp: 70,
    targetTemp: 70,
    hvacMode: "off",
  },
  {
    id: "bedroom",
    name: "bedroom",
    bounds: { leftX: 50, topY: 410, rightX: 575, bottomY: 780 },
    currentTemp: 68,
    targetTemp: 68,
    hvacMode: "off",
  },
  {
    id: "bathroom",
    name: "bathroom",
    bounds: { leftX: 625, topY: 410, rightX: 1150, bottomY: 780 },
    currentTemp: 74,
    targetTemp: 74,
    hvacMode: "off",
  },
];

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
  const handlePersonMove = useCallback(
    (personName: string, newRoomId: string) => {
      setHomeState((prev) => ({
        ...prev,
        people: prev.people.map((person) =>
          person.name === personName
            ? { ...person, location: newRoomId }
            : person
        ),
      }));
    },
    []
  );

  // Handle manual temperature change
  const handleTemperatureChange = useCallback(
    (roomId: string, newTemp: number) => {
      setHomeState((prev) => ({
        ...prev,
        rooms: prev.rooms.map((room) =>
          room.id === roomId
            ? { ...room, currentTemp: newTemp, targetTemp: newTemp }
            : room
        ),
      }));
    },
    []
  );

  // Execute a single tool call and update state (simplified - no animation)
  const executeToolCall = useCallback(
    async (toolCall: ToolCall): Promise<ToolCall> => {
      const { tool_name, arguments: args } = toolCall;

      try {
        switch (tool_name) {
          case "set_room_temperature": {
            const { room_name, temperature } = args;

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

            // Directly set the temperature (no animation)
            setHomeState((prev) => ({
              ...prev,
              rooms: prev.rooms.map((r) =>
                r.name === room_name || r.id === room_name
                  ? {
                      ...r,
                      currentTemp: temperature,
                      targetTemp: temperature,
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
    [homeState.rooms]
  );

  // Step-by-step execution - call LM and get plan
  const executeNextStep = useCallback(async () => {
    setIsExecuting(true);
    setReasoning("Calling language model to assess situation...");

    try {
      const prompt =
        "Assess the current smart home state. Keep all people comfortable by adjusting temperatures. Generate ONE command to improve comfort.";

      const response = await executePlanner(prompt, selectedLM, homeState);

      if (response.error) {
        console.error("Planner error:", response.error);
        setReasoning(`Error: ${response.error}`);
        setIsExecuting(false);
        return;
      }

      setReasoning(response.reasoning);

      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolCall = response.tool_calls[0];
        setCurrentToolCalls([toolCall]);

        // Execute the tool call
        const result = await executeToolCall(toolCall);
        setCurrentToolCalls([result]);

        setHomeState((prev) => ({
          ...prev,
          history: [...prev.history, result],
        }));
      }
    } catch (error) {
      console.error("Error in step execution:", error);
      setReasoning(`Error: ${error}`);
    }

    setIsExecuting(false);
  }, [selectedLM, homeState, executeToolCall]);

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
              Manually adjust temperatures and drag people between rooms. Click
              "Next Step" to have the LM suggest improvements.
            </p>
          </div>

          {/* Smart Home Visualization - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle>Home Layout</CardTitle>
              <CardDescription>
                Drag people between rooms • Adjust temperatures manually below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SmartHome
                rooms={homeState.rooms}
                people={homeState.people}
                onPersonMove={handlePersonMove}
              />

              {/* Manual Temperature Controls and Next Step Button */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  {homeState.rooms.map((room) => (
                    <div key={room.id} className="space-y-2">
                      <Label
                        htmlFor={`temp-${room.id}`}
                        className="text-sm font-medium"
                      >
                        {room.name
                          .replace(/_/g, " ")
                          .split(" ")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`temp-${room.id}`}
                          type="number"
                          min="60"
                          max="80"
                          value={Math.round(room.currentTemp)}
                          onChange={(e) =>
                            handleTemperatureChange(
                              room.id,
                              parseInt(e.target.value) || 60
                            )
                          }
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">
                          °F
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Next Step Button */}
                <Button
                  onClick={executeNextStep}
                  className="w-full"
                  disabled={isExecuting}
                >
                  {isExecuting ? "Executing..." : "Next Step"}
                </Button>
              </div>

              {/* Legend */}
              <div className="mt-6 space-y-1 text-sm text-muted-foreground">
                <div>
                  <strong>Temperature:</strong> Blue (cold) → White → Red (hot)
                </div>
                <div>
                  <strong>People:</strong> Green (Comfortable) | Red
                  (Uncomfortable)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tool Calls and Reasoning Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reasoning */}
            <Card>
              <CardHeader>
                <CardTitle>LM Reasoning</CardTitle>
                <CardDescription>
                  The language model's assessment of the current state
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reasoning ? (
                  <p className="text-sm">{reasoning}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click "Next Step" to see the LM's reasoning
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tool Calls Display */}
            <ToolCallDisplay
              reasoning=""
              toolCalls={currentToolCalls}
              isExecuting={isExecuting}
            />
          </div>
        </div>
      </main>
    </>
  );
}
