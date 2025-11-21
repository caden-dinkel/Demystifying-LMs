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
    move_history: list[str] = []  # List of moves in UCI format (e.g., ["e2e4", "e7e5"])

# Move in UCI format
class ChessMoveOutput(BaseModel):
    move: str
    prompt: str | None = None
    response: str | None = None

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

def build_chess_prompt(fen: str, possible_moves: list[str], tool_description: dict, model_name: str, move_history: list[str] = []) -> str:
    """Builds a prompt for the LM to choose the next chess move, customized per model."""
    # Determine whose turn it is from FEN
    board = chess.Board(fen)
    current_player = "White" if board.turn == chess.WHITE else "Black"
        
    # Format moves for easy parsing
    moves_list_str = "\n".join(f"- {move}" for move in possible_moves)

    # GPT-2: Simple instruction-based prompt
    if model_name == "GPT-2":
        prompt = (
            f"Current chess board: {fen}\n"
            f"{current_player}'s turn.\n"
            f"Legal moves:\n"
            f"{moves_list_str}\n\n"
            f"Pick one move from the list above. Output only the move (e.g., 'e2e4'):\n"
        )
    
    # ChessGPT: Trained on game transcripts with move notation
    elif model_name == "ChessGPT":
        # ChessGPT is trained on game sequences in SAN notation
        # Try to give it context that suggests it should output a move
        # Calculate move number from FEN (fullmove number is the last field)
        try:
            move_num = fen.split()[-1] if fen else "1"
        except:
            move_num = "1"
        
        # Format like a game transcript: "1. " for white, "1... " for black
        if current_player == "White":
            prompt = f"{move_num}. "
        else:
            prompt = f"{move_num}... "
    
    # Chess-Llama: Trained on UCI format game sequences with result tokens
    elif model_name == "Chess-Llama":
        # Chess-Llama is trained on game sequences in UCI format
        # Format: [Result token] move1 move2 move3 ...
        # According to the training, result tokens are: "1-0", "0-1", or "1/2-1/2"
        
        if move_history:
            # We have move history - use it!
            # Join all moves with spaces: "1-0 e2e4 e7e5 g1f3 ..."
            prompt = "1-0 " + " ".join(move_history) + " "
        else:
            # No move history - starting position
            prompt = "1-0 "
    
    # Llama-3.2: Structured chat format with detailed instructions
    else:  # Default to Llama-style for Llama-3.2 and any other models
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
        if data.move_history:
            print(f"📜 Move history: {data.move_history}")
        
        # Build prompt (model-specific)
        prompt = build_chess_prompt(fen, move_uci, TOOL_DESCRIPTION, data.model_name, data.move_history)
        
        print(f"📝 Prompt sent to LM:\n{prompt}\n")
        
        # Tokenize the prompt
        # Chess-Llama doesn't use token_type_ids, so we exclude them
        if data.model_name == "Chess-Llama":
            inputs = tokenizer(prompt, return_tensors="pt", return_token_type_ids=False)
        else:
            inputs = tokenizer(prompt, return_tensors="pt")
        
        # Move to model device
        inputs = {k: v.to(model.device) for k, v in inputs.items()}

        # Model-specific generation parameters
        if data.model_name == "ChessGPT":
            # ChessGPT: Use very low temperature and add repetition penalty
            # The model is character-level trained on game transcripts
            gen_params = {
                "max_new_tokens": 10,
                "do_sample": True,
                "temperature": 0.3,  # Lower temperature for more focused generation
                "top_p": 0.95,  # Higher top_p to allow more options
                "top_k": 100,  # Increase top_k for more diversity
                "repetition_penalty": 1.2,  # Discourage repeating the same patterns
                "pad_token_id": tokenizer.eos_token_id,
            }
        elif data.model_name == "GPT-2":
            # GPT-2: Simple completion, lower temperature
            gen_params = {
                "max_new_tokens": 8,
                "temperature": 0.3,
                "do_sample": True,
                "pad_token_id": tokenizer.eos_token_id,
                "eos_token_id": tokenizer.eos_token_id,
                "top_p": 0.9,
                "top_k": 20,
            }
        elif data.model_name == "Chess-Llama":
            # Chess-Llama: Trained on UCI format, needs to generate 4-5 character moves
            gen_params = {
                "max_new_tokens": 6,  # UCI moves are 4-5 chars (e.g., "e2e4" or "e7e8q")
                "temperature": 0.7,  # Moderate temperature for variety
                "do_sample": True,
                "pad_token_id": tokenizer.pad_token_id,
                "eos_token_id": tokenizer.eos_token_id,
                "top_p": 0.9,
                "top_k": 50,
            }
        else:
            # Llama-3.2 and others: More constrained
            gen_params = {
                "max_new_tokens": 5,
                "temperature": 0.1,
                "do_sample": True,
                "pad_token_id": tokenizer.eos_token_id,
                "eos_token_id": tokenizer.eos_token_id,
                "top_p": 0.95,
                "top_k": 5,
            }

        print(f"🔧 Generation params: {gen_params}")

        # Generate response
        try:
            outputs = model.generate(**inputs, **gen_params)
        except Exception as gen_error:
            print(f"❌ Generation error: {gen_error}")
            raise HTTPException(status_code=500, detail=f"Model generation failed: {str(gen_error)}")
        
        # Decode response
        try:
            generated_tokens = outputs[0][inputs['input_ids'].shape[1]:]
            response_text = tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()
            print(f"📝 LM Response:\n{response_text}\n")
            print(f"🔍 Legal moves: {move_uci[:10]}...\n")  # Show first 10 legal moves
        except Exception as decode_error:
            print(f"❌ Decoding error: {decode_error}")
            raise HTTPException(status_code=500, detail=f"Response decoding failed: {str(decode_error)}")
        
        # Extract JSON from response
        response_json = extract_json_from_response(response_text)
        
        # If JSON extraction succeeds, validate the move
        if response_json and "move" in response_json:
            move = response_json["move"].strip().lower()
            if move in move_uci:
                print(f"✅ Valid move from JSON: {move}")
                return ChessMoveOutput(move=move, prompt=prompt, response=response_text)
            else:
                print(f"⚠️ Move from JSON not in legal moves: {move}")
        
        # For ChessGPT specifically, try to parse SAN notation
        if data.model_name == "ChessGPT":
            try:
                board = chess.Board(fen)
                # ChessGPT is trained on game sequences and outputs multiple moves like "N c 5 N f 3 N c"
                # We need to parse ONLY THE FIRST valid move from the sequence
                # This means trying progressively longer combinations STARTING FROM THE BEGINNING
                
                tokens = response_text.strip().split()
                print(f"🎯 Parsing first move from token sequence: {tokens[:8]}")  # Show first 8 tokens
                
                # Try progressively longer combinations starting from token 0
                # Max length of 5 tokens should cover any reasonable chess move
                for length in range(1, min(len(tokens) + 1, 6)):
                    combined = "".join(tokens[:length])
                    try:
                        move_obj = board.parse_san(combined)
                        move_uci_str = move_obj.uci()
                        if move_uci_str in move_uci:
                            print(f"✅ Parsed FIRST move from tokens 0-{length-1}: '{combined}' -> UCI '{move_uci_str}'")
                            return ChessMoveOutput(move=move_uci_str, prompt=prompt, response=response_text)
                    except (ValueError, chess.InvalidMoveError, chess.IllegalMoveError):
                        continue
                
                # If starting from token 0 doesn't work, try starting from token 1
                # (in case first token is not part of the move)
                print(f"⚠️ No valid move starting from token 0, trying from token 1...")
                for length in range(1, min(len(tokens), 6)):
                    combined = "".join(tokens[1:1+length])
                    try:
                        move_obj = board.parse_san(combined)
                        move_uci_str = move_obj.uci()
                        if move_uci_str in move_uci:
                            print(f"✅ Parsed FIRST move from tokens 1-{length}: '{combined}' -> UCI '{move_uci_str}'")
                            return ChessMoveOutput(move=move_uci_str, prompt=prompt, response=response_text)
                    except (ValueError, chess.InvalidMoveError, chess.IllegalMoveError):
                        continue
                
                # Last resort: Find a legal knight/piece move if the output suggests one
                # E.g., if output is "N e 4", try to find any legal knight move
                if tokens and tokens[0] in ['N', 'B', 'R', 'Q', 'K']:
                    piece_type = tokens[0]
                    print(f"🔍 Looking for any legal {piece_type} move as fallback...")
                    for legal_move_uci in move_uci:
                        move = chess.Move.from_uci(legal_move_uci)
                        piece = board.piece_at(move.from_square)
                        if piece and piece.symbol().upper() == piece_type:
                            print(f"✅ Using legal {piece_type} move as fallback: {legal_move_uci}")
                            return ChessMoveOutput(move=legal_move_uci, prompt=prompt, response=response_text)
                        
            except Exception as san_error:
                print(f"⚠️ Error parsing SAN: {san_error}")
        
        # For Chess-Llama specifically, parse UCI format
        if data.model_name == "Chess-Llama":
            # Chess-Llama outputs moves in UCI format (e.g., "e2e4" or "e7e8q")
            # The output should be a 4-5 character string
            print(f"🎯 Parsing UCI move from Chess-Llama output: '{response_text}'")
            
            # Extract the first UCI-format move (4-5 characters: a-h, 1-8, a-h, 1-8, optional promotion)
            uci_pattern = r'([a-h][1-8][a-h][1-8][qrbn]?)'
            uci_match = re.search(uci_pattern, response_text.lower())
            
            if uci_match:
                potential_move = uci_match.group(1)
                if potential_move in move_uci:
                    print(f"✅ Valid UCI move from Chess-Llama: {potential_move}")
                    return ChessMoveOutput(move=potential_move, prompt=prompt, response=response_text)
                else:
                    print(f"⚠️ UCI move '{potential_move}' not in legal moves")
            
            # If no valid move found, try first 4-5 characters directly
            if len(response_text) >= 4:
                for length in [5, 4]:  # Try 5 chars first (with promotion), then 4
                    potential_move = response_text[:length].lower()
                    if potential_move in move_uci:
                        print(f"✅ Valid UCI move from start of output: {potential_move}")
                        return ChessMoveOutput(move=potential_move, prompt=prompt, response=response_text)
        
        # For ChessGPT specifically, try to parse SAN notation
        elif data.model_name == "ChessGPT":
            try:
                board = chess.Board(fen)
                # ChessGPT is trained on game sequences and outputs multiple moves like "N c 5 N f 3 N c"
                # We need to parse ONLY THE FIRST valid move from the sequence
                # This means trying progressively longer combinations STARTING FROM THE BEGINNING
                
                tokens = response_text.strip().split()
                print(f"🎯 Parsing first move from token sequence: {tokens[:8]}")  # Show first 8 tokens
                
                # Try progressively longer combinations starting from token 0
                # Max length of 5 tokens should cover any reasonable chess move
                for length in range(1, min(len(tokens) + 1, 6)):
                    combined = "".join(tokens[:length])
                    try:
                        move_obj = board.parse_san(combined)
                        move_uci_str = move_obj.uci()
                        if move_uci_str in move_uci:
                            print(f"✅ Parsed FIRST move from tokens 0-{length-1}: '{combined}' -> UCI '{move_uci_str}'")
                            return ChessMoveOutput(move=move_uci_str, prompt=prompt, response=response_text)
                    except (ValueError, chess.InvalidMoveError, chess.IllegalMoveError):
                        continue
                
                # If starting from token 0 doesn't work, try starting from token 1
                # (in case first token is not part of the move)
                print(f"⚠️ No valid move starting from token 0, trying from token 1...")
                for length in range(1, min(len(tokens), 6)):
                    combined = "".join(tokens[1:1+length])
                    try:
                        move_obj = board.parse_san(combined)
                        move_uci_str = move_obj.uci()
                        if move_uci_str in move_uci:
                            print(f"✅ Parsed FIRST move from tokens 1-{length}: '{combined}' -> UCI '{move_uci_str}'")
                            return ChessMoveOutput(move=move_uci_str, prompt=prompt, response=response_text)
                    except (ValueError, chess.InvalidMoveError, chess.IllegalMoveError):
                        continue
                
                # Last resort: Find a legal knight/piece move if the output suggests one
                # E.g., if output is "N e 4", try to find any legal knight move
                if tokens and tokens[0] in ['N', 'B', 'R', 'Q', 'K']:
                    piece_type = tokens[0]
                    print(f"🔍 Looking for any legal {piece_type} move as fallback...")
                    for legal_move_uci in move_uci:
                        move = chess.Move.from_uci(legal_move_uci)
                        piece = board.piece_at(move.from_square)
                        if piece and piece.symbol().upper() == piece_type:
                            print(f"✅ Using legal {piece_type} move as fallback: {legal_move_uci}")
                            return ChessMoveOutput(move=legal_move_uci, prompt=prompt, response=response_text)
                        
            except Exception as san_error:
                print(f"⚠️ Error parsing SAN: {san_error}")
        
        # If JSON extraction fails or move invalid, try to extract move directly from text
        # Look for UCI format moves (e.g., e2e4, g8h6) - try multiple patterns
        
        # First, try word boundary pattern
        move_match = re.search(r'\b([a-h][1-8][a-h][1-8][qrbn]?)\b', response_text.lower())
        if move_match:
            potential_move = move_match.group(1)
            print(f"🔍 Found potential move with word boundary: {potential_move}")
            if potential_move in move_uci:
                print(f"✅ Extracted move from text: {potential_move}")
                return ChessMoveOutput(move=potential_move, prompt=prompt, response=response_text)
        
        # If that fails, try without word boundaries (for cases like "move:e2e4")
        move_match = re.search(r'([a-h][1-8][a-h][1-8][qrbn]?)', response_text.lower())
        if move_match:
            potential_move = move_match.group(1)
            print(f"🔍 Found potential move without word boundary: {potential_move}")
            if potential_move in move_uci:
                print(f"✅ Extracted move from text: {potential_move}")
                return ChessMoveOutput(move=potential_move, prompt=prompt, response=response_text)
        
        # Last resort: check if the entire trimmed response is a valid move
        cleaned_response = response_text.strip().lower()
        if cleaned_response in move_uci:
            print(f"✅ Entire response is a valid move: {cleaned_response}")
            return ChessMoveOutput(move=cleaned_response, prompt=prompt, response=response_text)
        
        print(f"❌ Could not extract valid move from response")
        print(f"❌ Response text: '{response_text}'")
        print(f"❌ First 10 legal moves were: {move_uci[:10]}")
        return ChessMoveOutput(move="invalid_move", prompt=prompt, response=response_text)
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Issue with Calling LM: {str(e)}")