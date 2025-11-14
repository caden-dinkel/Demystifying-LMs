import { ToolCall } from "@/utilities/types";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ToolCallDisplayProps {
  reasoning: string;
  toolCalls: ToolCall[];
  isExecuting: boolean;
}

export const ToolCallDisplay = ({
  reasoning,
  toolCalls,
  isExecuting,
}: ToolCallDisplayProps) => {
  const [expanded, setExpanded] = useState(true);

  if (!reasoning && toolCalls.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>LM Planner Output</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {/* Reasoning Section */}
          {reasoning && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Reasoning:
              </h4>
              <p className="text-sm">{reasoning}</p>
            </div>
          )}

          {/* Tool Calls Section */}
          {toolCalls.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Tool Calls ({toolCalls.length}):
              </h4>
              {toolCalls.map((toolCall, index) => (
                <div
                  key={index}
                  className="bg-card border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-mono font-semibold text-primary">
                        {toolCall.tool_name}
                      </span>
                    </div>

                    {/* Success/Failure indicator */}
                    {toolCall.success !== undefined && (
                      <span className="text-lg">
                        {toolCall.success ? "✅" : "❌"}
                      </span>
                    )}
                  </div>

                  {/* Arguments */}
                  <div className="text-sm">
                    <strong className="text-muted-foreground">
                      Arguments:
                    </strong>
                    <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(toolCall.arguments, null, 2)}
                    </pre>
                  </div>

                  {/* Result (if available) */}
                  {toolCall.result !== undefined && (
                    <div className="text-sm">
                      <strong className="text-muted-foreground">Result:</strong>
                      <div className="mt-1 bg-blue-50 dark:bg-blue-950 p-2 rounded text-sm">
                        {typeof toolCall.result === "string"
                          ? toolCall.result
                          : JSON.stringify(toolCall.result)}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  {toolCall.timestamp && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(toolCall.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Executing indicator */}
          {isExecuting && (
            <div className="text-center py-4 text-primary font-semibold">
              Executing tool calls...
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
