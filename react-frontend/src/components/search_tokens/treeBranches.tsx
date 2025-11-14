export interface SearchTreeConnectorProps {
  rhsBoxes: DOMRect[];
  lhsBox: DOMRect;
  parentRect: DOMRect | null;
  animatingTokenIndex?: number | null;
}

export const SearchTreeConnector = ({
  rhsBoxes,
  lhsBox,
  parentRect,
  animatingTokenIndex = null,
}: SearchTreeConnectorProps) => {
  if (!lhsBox || rhsBoxes.length === 0 || !parentRect) return null;

  // Simply use viewport coordinates relative to parent
  // No need for scroll offsets since getBoundingClientRect already accounts for scrolling
  const offsetX = parentRect.left;
  const offsetY = parentRect.top;

  // Convert all boxes to relative coordinates (relative to parent container)
  const allBoxes = [lhsBox, ...rhsBoxes];
  const relativeBoxes = allBoxes.map((box) => ({
    left: box.left - offsetX,
    right: box.right - offsetX,
    top: box.top - offsetY,
    bottom: box.bottom - offsetY,
    height: box.height,
    width: box.width,
  }));

  // Calculate bounds
  const minX = Math.min(...relativeBoxes.map((box) => box.left));
  const minY = Math.min(...relativeBoxes.map((box) => box.top));
  const maxX = Math.max(...relativeBoxes.map((box) => box.right));
  const maxY = Math.max(...relativeBoxes.map((box) => box.bottom));

  const BUFFER = 20;
  const svgLeft = minX - BUFFER;
  const svgTop = minY - BUFFER;
  const svgWidth = maxX - minX + 2 * BUFFER;
  const svgHeight = maxY - minY + 2 * BUFFER;

  // Hub-and-spoke pattern:
  // 1. Start point: right edge of LHS box (prompt display)
  // Calculate position within the SVG coordinate system
  const startX = lhsBox.right - offsetX - svgLeft;
  const startY = lhsBox.top - offsetY + lhsBox.height / 2 - svgTop;

  // 2. Calculate hub position and RHS token positions within SVG
  const rhsRelativeBoxes = rhsBoxes.map((box) => ({
    left: box.left - offsetX - svgLeft,
    centerY: box.top - offsetY + box.height / 2 - svgTop,
  }));

  const minRhsX = Math.min(...rhsRelativeBoxes.map((box) => box.left));

  // Hub is positioned between start and tokens, shifted more to the left
  const hubX = startX + (minRhsX - startX) * 0.35; // Shifted left (was 0.5)
  const hubY = startY; // Center with the line from prompt display
  const hubRadius = 6;

  // 3. Create paths
  const mainPath = `M ${startX} ${startY} L ${hubX} ${hubY}`;

  const spokePaths = rhsRelativeBoxes.map((box, index) => {
    const endX = box.left;
    const endY = box.centerY;

    // Add curves to the spokes - curve in opposite direction
    const controlPointY = hubY + (endY - hubY) * 0.5;
    const curvedPath = `M ${hubX} ${hubY} Q ${hubX} ${controlPointY}, ${endX} ${endY}`;

    const isAnimating = animatingTokenIndex === index;

    return (
      <path
        key={`spoke-${index}`}
        d={curvedPath}
        stroke="var(--connector-color)"
        strokeWidth={isAnimating ? "3" : "2"}
        fill="none"
        style={
          isAnimating
            ? {
                strokeDasharray: "10 5",
                animation: "dash 0.5s linear infinite",
                stroke: "var(--accent-color, #3b82f6)",
              }
            : undefined
        }
      />
    );
  });

  return (
    <svg
      style={{
        position: "absolute",
        top: svgTop,
        left: svgLeft,
        width: svgWidth,
        height: svgHeight,
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 1,
      }}
    >
      {/* Main line from prompt to hub */}
      <path
        d={mainPath}
        stroke="var(--connector-color)"
        strokeWidth="2"
        fill="none"
      />

      {/* Hub circle */}
      <circle
        cx={hubX}
        cy={hubY}
        r={hubRadius}
        fill="var(--connector-color)"
        stroke="var(--connector-color)"
        strokeWidth="1"
      />

      {/* Spokes from hub to tokens */}
      {spokePaths}
    </svg>
  );
};
