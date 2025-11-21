import chess
import re
from ..models import SUPPORTED_MODELS, extract_json_from_response
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/chess",
    tags=["Chess APIs"]
)

TOOL_DESCRIPTION = {
    "name": "make_chess_move",
    "description": ("Make a chess move given the current board state in FEN notation and the move in UCI format. "
                    "Input should be a JSON object with 'fen' and 'move' fields."),
    "parameters": {
        "type": "object",
        "properties": {
            "fen": {
                "type": "string",
                "description": "Current board state in FEN notation"
            },
            "move": {
                "type": "string",
                "description": "Move in UCI format (e.g., 'e2e4')"
            }
        },
        "required": ["fen", "move"]
    }
}

class ChessStateInput(BaseModel):
    fen: str
    model_name: str

# Move in UCI format
class ChessMoveOutput(BaseModel):
    move: str

class ApplyMoveInput(BaseModel):
    fen: str
    move: str

class ApplyMoveOutput(BaseModel):
    new_fen: str
    success: bool
    error: str | None = None

def get_possible_moves(fen: str) -> list[str]:
    """Returns a list of possible moves in UCI format for the given FEN."""
    try:
        board = chess.Board(fen)
        return [move.uci() for move in board.legal_moves]
    except ValueError:
        return []

def build_chess_prompt(fen: str, possible_moves: list[str], tool_description: dict) -> str:
    """Builds a prompt for the LM to choose the next chess move."""
    # Determine whose turn it is from FEN
    board = chess.Board(fen)
    current_player = "White" if board.turn == chess.WHITE else "Black"
        
    # Format moves for easy parsing
    moves_list_str = "\n".join(f"- {move}" for move in possible_moves)

    prompt = (
        f"<|system|>\n"
        f"You are a skilled chess engine. Your role is to select the single best move "
        f"for the current player based on the FEN and the provided list of legal moves. "
        f"You must output ONLY the chosen move in UCI format (e.g., 'e2e4' or 'a7a8q')."
        f"Do not include any other text, explanations, or analysis.\n"
        f"<|end_of_system|>\n"
        f"<|user|>\n"
        f"The current board state is: {fen}\n"
        f"It is {current_player}'s turn.\n"
        f"Available legal moves are:\n"
        f"{moves_list_str}\n\n"
        f"Choose the single best move.\n"
        f"<|end_of_user|>\n"
        f"<|assistant|>\n"
    )
    return prompt

@router.get("/get_possible_moves")
async def get_chess_possible_moves(fen: str):
    """API endpoint to get possible chess moves given FEN."""
    moves = get_possible_moves(fen)
    if not moves:
        raise HTTPException(status_code=400, detail="Invalid FEN or no possible moves.")
    return {"possible_moves": moves}


# API Endpoint takes in the current FEN and calls the LM to get the next move
@router.post("/make_move")
async def make_chess_move(data: ChessStateInput):
    """API endpoint to make a chess move given FEN and UCI move."""
    fen = data.fen
    move_uci = get_possible_moves(fen)    
    print(f"Moves UCI: {move_uci}")
    if not fen or not move_uci:
        return ChessMoveOutput(move="game_over")
    # 1. Select LM components based on input
    try:
        if data.model_name not in SUPPORTED_MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported model: {data.model_name}. Supported models are: {list(SUPPORTED_MODELS.keys())}"
            )
        tokenizer = SUPPORTED_MODELS[data.model_name]["tokenizer"]
        model = SUPPORTED_MODELS[data.model_name]["model"]
        
        print(f"♟️ Chess move request for FEN: '{fen}' using {data.model_name}")
        
        # Build prompt
        prompt = build_chess_prompt(fen, move_uci, TOOL_DESCRIPTION)
        
        print(f"📝 Prompt sent to LM:\n{prompt}\n")
        # Tokenize the prompt directly (without chat template for simpler handling)
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

        # Generate response with minimal tokens
        outputs = model.generate(
            **inputs,
            max_new_tokens=5,
            temperature=0.2,     # Slightly higher than 0.0, but still low
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
            top_p=0.95,
            top_k=5,             # Highly constrain the token choice pool
        )
        
        # Decode response
        generated_tokens = outputs[0][inputs['input_ids'].shape[1]:]
        response_text = tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()
        print(f"📝 LM Response:\n{response_text}\n")
        print(f"🔍 Legal moves: {move_uci[:10]}...\n")  # Show first 10 legal moves
        
        # Extract JSON from response
        response_json = extract_json_from_response(response_text)
        
        # If JSON extraction succeeds, validate the move
        if response_json and "move" in response_json:
            move = response_json["move"].strip().lower()
            if move in move_uci:
                print(f"✅ Valid move from JSON: {move}")
                return ChessMoveOutput(move=move)
            else:
                print(f"⚠️ Move from JSON not in legal moves: {move}")
        
        # If JSON extraction fails or move invalid, try to extract move directly from text
        # Look for UCI format moves (e.g., e2e4, g8h6) - try multiple patterns
        
        # First, try word boundary pattern
        move_match = re.search(r'\b([a-h][1-8][a-h][1-8][qrbn]?)\b', response_text.lower())
        if move_match:
            potential_move = move_match.group(1)
            print(f"🔍 Found potential move with word boundary: {potential_move}")
            if potential_move in move_uci:
                print(f"✅ Extracted move from text: {potential_move}")
                return ChessMoveOutput(move=potential_move)
        
        # If that fails, try without word boundaries (for cases like "move:e2e4")
        move_match = re.search(r'([a-h][1-8][a-h][1-8][qrbn]?)', response_text.lower())
        if move_match:
            potential_move = move_match.group(1)
            print(f"🔍 Found potential move without word boundary: {potential_move}")
            if potential_move in move_uci:
                print(f"✅ Extracted move from text: {potential_move}")
                return ChessMoveOutput(move=potential_move)
        
        # Last resort: check if the entire trimmed response is a valid move
        cleaned_response = response_text.strip().lower()
        if cleaned_response in move_uci:
            print(f"✅ Entire response is a valid move: {cleaned_response}")
            return ChessMoveOutput(move=cleaned_response)
        
        print(f"❌ Could not extract valid move from response")
        print(f"❌ Response text: '{response_text}'")
        print(f"❌ First 10 legal moves were: {move_uci[:10]}")
        return ChessMoveOutput(move="invalid_move")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Issue with Calling LM: {e}")