"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { getLMMove } from "@/api/chessClient";
import { useLMSettings } from "@/components/settings/lmSettingsProvider";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemGroup,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import styles from "../../styles/chess.module.css";

type GameStatus = "playing" | "game-over";

const AIChessGame = () => {
  const { selectedLM } = useLMSettings();
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [isLMThinking, setIsLMThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]); // Display history (SAN format)
  const [uciMoveHistory, setUciMoveHistory] = useState<string[]>([]); // UCI format for API
  const [statusMessage, setStatusMessage] = useState("Your turn (White)");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allowIllegalMoves, setAllowIllegalMoves] = useState(false);
  const [optionSquares, setOptionSquares] = useState({});
  const [pendingMove, setPendingMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [lastLMPrompt, setLastLMPrompt] = useState<string | null>(null);
  const [lastLMResponse, setLastLMResponse] = useState<string | null>(null);

  // Update game status whenever position changes
  useEffect(() => {
    if (game.isGameOver()) {
      setGameStatus("game-over");
      if (game.isCheckmate()) {
        setStatusMessage(
          game.turn() === "w" ? "Checkmate! Black wins!" : "Checkmate! You win!"
        );
      } else if (game.isStalemate()) {
        setStatusMessage("Stalemate - Draw!");
      } else if (game.isDraw()) {
        setStatusMessage("Draw!");
      } else {
        setStatusMessage("Game Over!");
      }
    } else {
      setGameStatus("playing");
      if (game.isCheck()) {
        setStatusMessage(
          game.turn() === "w" ? "Check! Your turn" : "Check! LM's turn"
        );
      } else {
        setStatusMessage(
          game.turn() === "w" ? "Your turn (White)" : "LM is thinking..."
        );
      }
    }
  }, [position, game]);

  // Trigger LM move when it's black's turn
  useEffect(() => {
    if (game.turn() === "b" && gameStatus === "playing" && !isLMThinking) {
      makeLMMove();
    }
  }, [game.turn(), gameStatus, isLMThinking]);

  const makeLMMove = async () => {
    setIsLMThinking(true);
    setErrorMessage(null);
    try {
      const currentFen = game.fen();
      const lmMoveData = await getLMMove(
        currentFen,
        selectedLM,
        uciMoveHistory
      );

      // Store the prompt and response
      if (lmMoveData.prompt) setLastLMPrompt(lmMoveData.prompt);
      if (lmMoveData.response) setLastLMResponse(lmMoveData.response);

      const lmMove = lmMoveData.move;

      if (lmMove === "game_over" || lmMove === "invalid_move") {
        setErrorMessage("LM couldn't generate a valid move. You may have won!");
        setGameStatus("game-over");
        setIsLMThinking(false);
        return;
      }

      // Try to make the move
      try {
        const move = game.move(lmMove);
        if (move) {
          setPosition(game.fen());
          setMoveHistory((prev) => [
            ...prev,
            `${Math.floor(prev.length / 2) + 1}... ${move.san}`,
          ]);
          setUciMoveHistory((prev) => [...prev, lmMove]);
        } else {
          // Move was illegal
          if (allowIllegalMoves) {
            // Force the move through by manually manipulating the board
            // Parse the UCI move format (e.g., "e7e5")
            const from = lmMove.substring(0, 2) as any;
            const to = lmMove.substring(2, 4) as any;
            const promotion =
              lmMove.length > 4 ? (lmMove.substring(4, 5) as any) : undefined;

            // Get the piece at the source square
            const piece = game.get(from);

            if (piece) {
              // Create a new Chess instance to manipulate
              const newGame = new Chess(game.fen());

              // Remove piece from source
              newGame.remove(from);

              // Place piece at destination (capturing if needed)
              newGame.put(
                {
                  type: promotion ? promotion : piece.type,
                  color: piece.color,
                },
                to
              );

              // Switch turn
              const newFen = newGame.fen();
              const fenParts = newFen.split(" ");
              fenParts[1] = fenParts[1] === "w" ? "b" : "w"; // Switch turn
              const correctedFen = fenParts.join(" ");

              // Load the new position
              game.load(correctedFen);
              setPosition(game.fen());
              setMoveHistory((prev) => [
                ...prev,
                `${Math.floor(prev.length / 2) + 1}... ${lmMove} (illegal)`,
              ]);
              setUciMoveHistory((prev) => [...prev, lmMove]);
              setErrorMessage(
                `⚠️ LM made an illegal move: ${lmMove} (forced through)`
              );
            } else {
              setErrorMessage(`⚠️ LM move invalid - no piece at ${from}`);
            }
          } else {
            setErrorMessage(
              `❌ LM suggested an illegal move: ${lmMove}. Game over!`
            );
            setGameStatus("game-over");
          }
        }
      } catch (error) {
        console.error("Error making LM move:", error);
        if (allowIllegalMoves) {
          setErrorMessage(
            "⚠️ LM suggested an invalid move format (allowed by rules)"
          );
          setPosition(game.fen());
        } else {
          setErrorMessage("❌ LM suggested an invalid move format. Game over!");
          setGameStatus("game-over");
        }
      }
    } catch (error) {
      console.error("Error getting LM move:", error);
      setErrorMessage("Failed to get move from LM");
    } finally {
      setIsLMThinking(false);
    }
  };

  const onSquareClick = (square: any) => {
    // Only show options for white's pieces during white's turn
    if (game.turn() !== "w" || gameStatus !== "playing" || isLMThinking) {
      return;
    }

    const piece = game.get(square);

    // If clicking on a white piece, show available moves
    if (piece && piece.color === "w") {
      const moves = game.moves({ square, verbose: true });
      if (moves.length === 0) {
        setOptionSquares({});
        return;
      }

      const newSquares: Record<string, any> = {};
      moves.forEach((move: any) => {
        const targetPiece = game.get(move.to);
        newSquares[move.to] = {
          background:
            targetPiece && targetPiece.color !== piece.color
              ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
              : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
          borderRadius: "50%",
        };
      });
      newSquares[square] = {
        background: "rgba(255, 255, 0, 0.4)",
      };
      setOptionSquares(newSquares);
    } else {
      setOptionSquares({});
    }
  };

  const onPieceDragBegin = ({ piece, square }: any) => {
    onSquareClick(square);
  };

  const onDrop = useCallback(
    ({ sourceSquare, targetSquare }: any) => {
      // Clear highlights
      setOptionSquares({});

      // Don't allow moves during LM's turn or when game is over
      if (game.turn() !== "w" || gameStatus !== "playing" || !targetSquare) {
        return false;
      }

      // Check if this move is a pawn promotion
      const piece = game.get(sourceSquare as any);
      const isPromotion =
        piece &&
        piece.type === "p" &&
        piece.color === "w" &&
        targetSquare[1] === "8";

      if (isPromotion) {
        // Store the move and show promotion dialog
        setPendingMove({ from: sourceSquare, to: targetSquare });
        setShowPromotionDialog(true);
        return false; // Don't complete the move yet
      }

      try {
        // Try to make the move
        const move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q", // Default to queen if not a promotion
        });

        // If the move is illegal, return false
        if (move === null) return false;

        // Update position and history
        setPosition(game.fen());
        setMoveHistory((prev) => [
          ...prev,
          `${Math.floor(prev.length / 2) + 1}. ${move.san}`,
        ]);
        setUciMoveHistory((prev) => [...prev, move.from + move.to]);
        setErrorMessage(null);
        return true;
      } catch (error) {
        // Illegal move
        return false;
      }
    },
    [game, gameStatus]
  );

  const handlePromotion = (piece: "q" | "r" | "b" | "n") => {
    if (!pendingMove) return;

    try {
      const move = game.move({
        from: pendingMove.from,
        to: pendingMove.to,
        promotion: piece,
      });

      if (move) {
        setPosition(game.fen());
        setMoveHistory((prev) => [
          ...prev,
          `${Math.floor(prev.length / 2) + 1}. ${move.san}`,
        ]);
        setUciMoveHistory((prev) => [...prev, move.from + move.to + piece]);
        setErrorMessage(null);
      }
    } catch (error) {
      console.error("Error making promotion move:", error);
    } finally {
      setShowPromotionDialog(false);
      setPendingMove(null);
    }
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setPosition(newGame.fen());
    setGameStatus("playing");
    setMoveHistory([]);
    setUciMoveHistory([]);
    setErrorMessage(null);
    setIsLMThinking(false);
  };

  return (
    <div className={styles.chessContainer}>
      {/* Backdrop for promotion dialog */}
      {showPromotionDialog && <div className={styles.backdrop} />}

      {/* Chessboard */}
      <div className={styles.boardContainer}>
        <Chessboard
          options={{
            position,
            onPieceDrop: onDrop,
            onSquareClick,
            onPieceDrag: onPieceDragBegin,
            squareStyles: optionSquares,
            allowDragging:
              game.turn() === "w" && gameStatus === "playing" && !isLMThinking,
            boardStyle: {
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            },
          }}
        />

        {/* Promotion Dialog */}
        {showPromotionDialog && (
          <div className={styles.promotionDialog}>
            <h3 className={styles.promotionTitle}>Choose Promotion Piece</h3>
            <div className={styles.promotionGrid}>
              <button
                onClick={() => handlePromotion("q")}
                className={styles.pieceButton}
                title="Queen"
              >
                <span className={styles.pieceIcon}>♕</span>
                <span className={styles.pieceName}>Queen</span>
              </button>
              <button
                onClick={() => handlePromotion("r")}
                className={styles.pieceButton}
                title="Rook"
              >
                <span className={styles.pieceIcon}>♖</span>
                <span className={styles.pieceName}>Rook</span>
              </button>
              <button
                onClick={() => handlePromotion("b")}
                className={styles.pieceButton}
                title="Bishop"
              >
                <span className={styles.pieceIcon}>♗</span>
                <span className={styles.pieceName}>Bishop</span>
              </button>
              <button
                onClick={() => handlePromotion("n")}
                className={styles.pieceButton}
                title="Knight"
              >
                <span className={styles.pieceIcon}>♘</span>
                <span className={styles.pieceName}>Knight</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Game Info Panel */}
      <div className={styles.controlsSection}>
        {/* Status */}
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Game Status</ItemTitle>
            <ItemDescription>
              {statusMessage}
              {isLMThinking && (
                <span className="block mt-2 text-muted-foreground">
                  Waiting for {selectedLM} to decide...
                </span>
              )}
              {errorMessage && (
                <span className="block mt-2 text-destructive">
                  {errorMessage}
                </span>
              )}
            </ItemDescription>
          </ItemContent>
        </Item>

        {/* Controls */}
        <div className="flex flex-col gap-3">
          <Button onClick={resetGame} variant="outline" className="w-full">
            New Game
          </Button>

          <Button
            onClick={() => setAllowIllegalMoves(!allowIllegalMoves)}
            variant={allowIllegalMoves ? "default" : "outline"}
            className="w-full"
          >
            {allowIllegalMoves ? "✓ Allowing" : "Disallowing"} Illegal Moves
          </Button>
        </div>

        {/* Move History */}
        <Card>
          <CardHeader>
            <CardTitle>Move History</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            <ItemGroup>
              {moveHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No moves yet. Make the first move!
                </p>
              ) : (
                moveHistory.map((move, index) => (
                  <Item key={index} size="sm">
                    <ItemContent>
                      <span className="text-sm">{move}</span>
                    </ItemContent>
                  </Item>
                ))
              )}
            </ItemGroup>
          </CardContent>
        </Card>

        {/* LM Communication */}
        <Card className={styles.lmCommunicationCard}>
          <CardHeader>
            <CardTitle>LM Communication</CardTitle>
          </CardHeader>
          <CardContent className={styles.lmCommunicationContent}>
            <div className={styles.communicationSection}>
              <div className={styles.communicationLabel}>Prompt Sent to LM</div>
              {lastLMPrompt ? (
                <div className={styles.communicationText}>{lastLMPrompt}</div>
              ) : (
                <div className={styles.communicationEmpty}>
                  No moves made yet. The LM's prompt will appear here.
                </div>
              )}
            </div>
            <div className={styles.communicationSection}>
              <div className={styles.communicationLabel}>LM Response</div>
              {lastLMResponse ? (
                <div className={styles.communicationText}>{lastLMResponse}</div>
              ) : (
                <div className={styles.communicationEmpty}>
                  No moves made yet. The LM's response will appear here.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Info */}
        <Card>
          <CardHeader>
            <CardTitle>Game Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>
              <span className="font-medium">Turn:</span>{" "}
              <span>{game.turn() === "w" ? "White (You)" : "Black (LM)"}</span>
            </div>
            <div>
              <span className="font-medium">Moves:</span>{" "}
              <span>{moveHistory.length}</span>
            </div>
            <div>
              <span className="font-medium">Status:</span>{" "}
              <span>
                {game.isCheck()
                  ? "Check!"
                  : game.isCheckmate()
                  ? "Checkmate!"
                  : game.isStalemate()
                  ? "Stalemate"
                  : game.isDraw()
                  ? "Draw"
                  : "Active"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* How to Play */}
        <Card>
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <ul className="space-y-1 list-disc pl-5">
              <li>You play as White</li>
              <li>The LM ({selectedLM}) plays as Black</li>
              <li>Drag and drop pieces to make moves</li>
              <li>The LM will automatically respond after your move</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIChessGame;
