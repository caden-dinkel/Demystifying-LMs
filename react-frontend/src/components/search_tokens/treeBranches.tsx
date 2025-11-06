export interface SearchTreeConnectorProps {
  rhsBoxes: DOMRect[];
  lhsBox: DOMRect;
  parentRect: DOMRect | null;
}

export const SearchTreeConnector = ({
  rhsBoxes,
  lhsBox,
  parentRect,
}: SearchTreeConnectorProps) => {
  // Removed updateCounter
  if (!lhsBox || rhsBoxes.length === 0 || !parentRect) return null;

  const offsetX = parentRect.left;
  const offsetY = parentRect.top;

  // 1. Calculate the bounding box of the necessary paths *relative to the parent*
  const allBoxes = [lhsBox, ...rhsBoxes];

  // Convert all token viewport coordinates to coordinates relative to the parent
  // We subtract the parent's viewport coordinates (offsetX/Y) from the token's viewport coordinates.
  const relativeBoxes = allBoxes.map((box) => ({
    left: box.left - offsetX,
    right: box.right - offsetX,
    top: box.top - offsetY,
    bottom: box.bottom - offsetY,
    height: box.height,
  }));

  // Find the overall bounds of the relative boxes
  const minX = Math.min(...relativeBoxes.map((box) => box.left));
  const minY = Math.min(...relativeBoxes.map((box) => box.top));
  const maxX = Math.max(...relativeBoxes.map((box) => box.right));
  const maxY = Math.max(...relativeBoxes.map((box) => box.bottom));

  const BUFFER = 5;

  // These are the SVG's position and size relative to the SearchTree container
  const svgLeft = minX - BUFFER;
  const svgTop = minY - BUFFER;

  const svgWidth = maxX - minX + 2 * BUFFER;
  const svgHeight = maxY - minY + 2 * BUFFER;

  // 2. Map RHS boxes to paths (Coordinates relative to the SVG's top-left)
  const paths = rhsBoxes.map((rhsBox, index) => {
    // Token's Viewport Position - Parent's Viewport Position - SVG's Relative Position

    // START POINT: Midpoint of the RHS of LHS box
    const startX = lhsBox.right - offsetX - svgLeft;
    const startY = lhsBox.top + lhsBox.height / 2 - offsetY - svgTop;

    // END POINT: Midpoint of the LHS of RHS box
    const endX = rhsBox.left - offsetX - svgLeft;
    const endY = rhsBox.top + rhsBox.height / 2 - offsetY - svgTop;

    // ... path data calculation remains the same ...
    const curveAmount = Math.abs(endX - startX) / 3;

    const pathData = `
      M ${startX} ${startY}
      C ${startX + curveAmount} ${startY},
        ${endX - curveAmount} ${endY},
        ${endX} ${endY}
    `;

    return (
      <path
        key={index}
        d={pathData}
        stroke="var(--connector-color)"
        strokeWidth="2"
        fill="none"
      />
    );
  });

  return (
    <svg
      style={{
        position: "absolute", // CRITICAL: Relative to SearchTree container
        top: svgTop, // Positioned relative to the SearchTree container
        left: svgLeft, // Positioned relative to the SearchTree container
        width: svgWidth,
        height: svgHeight,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {paths}
    </svg>
  );
};
