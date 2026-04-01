"""
Word Association Game API — v4
Adds WordNet-based word categories as a second hint layer.
"""

from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
import torch
import torch.nn.functional as F
import numpy as np
import random
import uuid
import threading

import nltk
from nltk.stem import WordNetLemmatizer
from nltk.corpus import wordnet as wn

from ..models import SUPPORTED_MODELS

# ------------------------------------------------------------------ #
#  NLTK data
# ------------------------------------------------------------------ #

nltk.download("wordnet", quiet=True)
_lemmatizer = WordNetLemmatizer()


def _lemmatize(word: str) -> str:
    candidates = set()
    for pos in ("v", "n", "a", "r"):
        candidates.add(_lemmatizer.lemmatize(word, pos=pos))
    valid = [c for c in candidates if len(c) >= 3]
    return min(valid, key=len) if valid else word


# ------------------------------------------------------------------ #
#  Word categories via WordNet lexicographer file names
# ------------------------------------------------------------------ #

_LEXNAME_TO_CATEGORY: dict[str, str] = {
    # Animal
    "noun.animal":        "Animal",

    # Nature
    "noun.plant":         "Nature",
    "noun.phenomenon":    "Nature",
    "noun.substance":     "Nature",
    "verb.weather":       "Nature",

    # Person
    "noun.person":        "Person",
    "noun.group":         "Person",
    "noun.body":          "Person",
    "verb.body":          "Person",
    "verb.social":        "Person",

    # Object
    "noun.artifact":      "Object",
    "noun.object":        "Object",
    "noun.possession":    "Object",
    "verb.possession":    "Object",

    # Place
    "noun.location":      "Place",

    # Food
    "noun.food":          "Food",
    "verb.consumption":   "Food",

    # Mind
    "noun.cognition":     "Mind",
    "noun.feeling":       "Mind",
    "noun.state":         "Mind",
    "noun.motive":        "Mind",
    "verb.cognition":     "Mind",
    "verb.emotion":       "Mind",
    "verb.perception":    "Mind",

    # Communication
    "noun.communication": "Communication",
    "verb.communication": "Communication",

    # Action
    "noun.act":           "Action",
    "noun.event":         "Action",
    "noun.process":       "Action",
    "verb.motion":        "Action",
    "verb.contact":       "Action",
    "verb.competition":   "Action",
    "verb.creation":      "Action",
    "verb.change":        "Action",

    # Descriptor
    "noun.attribute":     "Descriptor",
    "noun.shape":         "Descriptor",
    "noun.relation":      "Descriptor",
    "verb.stative":       "Descriptor",
    "adj.all":            "Descriptor",
    "adj.pert":           "Descriptor",
    "adj.ppl":            "Descriptor",
    "adv.all":            "Descriptor",

    # Measurement
    "noun.quantity":      "Measurement",
    "noun.time":          "Measurement",

    # General (fallback)
    "noun.Tops":          "General",
}

_DEFAULT_CATEGORY = "General"


def _get_category(word: str) -> str:
    """Look up the broad semantic category of a word via WordNet."""
    synsets = wn.synsets(word)
    if not synsets:
        return _DEFAULT_CATEGORY
    lexname = synsets[0].lexname()
    return _LEXNAME_TO_CATEGORY.get(lexname, _DEFAULT_CATEGORY)


# ------------------------------------------------------------------ #
#  Router
# ------------------------------------------------------------------ #

router = APIRouter(prefix="/game", tags=["Word Game APIs"])

# ------------------------------------------------------------------ #
#  Build lemmatised vocabulary
# ------------------------------------------------------------------ #

print("Word Game: building lemmatised vocabulary…")

_tokenizer = SUPPORTED_MODELS["GPT-2"]["tokenizer"]
_model = SUPPORTED_MODELS["GPT-2"]["model"]
_embedding_weights = _model.transformer.wte.weight.detach().float()


def _build_lemma_groups() -> dict[str, list[int]]:
    vocab = _tokenizer.get_vocab()
    groups: dict[str, list[int]] = {}
    for token_str, token_id in vocab.items():
        if not token_str.startswith("Ġ"):
            continue
        word = token_str[1:]
        if not word.isalpha() or not word.islower():
            continue
        if len(word) < 3 or len(word) > 10:
            continue
        lemma = _lemmatize(word)
        if len(lemma) < 3:
            continue
        groups.setdefault(lemma, []).append(token_id)
    return groups


_lemma_groups = _build_lemma_groups()

WORD_NAMES: list[str] = list(_lemma_groups.keys())
WORD_TO_IDX: dict[str, int] = {w: i for i, w in enumerate(WORD_NAMES)}

_avg_embeddings = torch.stack(
    [_embedding_weights[ids].mean(dim=0) for ids in _lemma_groups.values()]
)
_word_embeddings_norm = F.normalize(_avg_embeddings, p=2, dim=1)

TOTAL_WORDS = len(WORD_NAMES)

# Precompute categories for every word
print("Word Game: assigning categories…")
WORD_CATEGORIES: list[str] = [_get_category(w) for w in WORD_NAMES]
print(f"Word Game: {TOTAL_WORDS} words loaded across "
      f"{len(set(WORD_CATEGORIES))} categories.")

HINT_FACTOR = 0.10

# ------------------------------------------------------------------ #
#  Game state
# ------------------------------------------------------------------ #

_games: dict[str, "GameState"] = {}
_games_lock = threading.Lock()


class GameState:

    def __init__(self) -> None:
        self.game_id: str = str(uuid.uuid4())
        self.target_idx: int = random.randint(0, TOTAL_WORDS - 1)
        self.target_word: str = WORD_NAMES[self.target_idx]
        self.target_category: str = WORD_CATEGORIES[self.target_idx]
        target_emb = _word_embeddings_norm[self.target_idx]

        sims = torch.mv(_word_embeddings_norm, target_emb)
        self.similarities: np.ndarray = sims.numpy()

        sorted_idx = np.argsort(-self.similarities)
        self.sorted_indices: np.ndarray = sorted_idx
        self.rank_of: dict[int, int] = {
            int(idx): r + 1 for r, idx in enumerate(sorted_idx)
        }
        self.guesses: list[str] = []

    @staticmethod
    def percentile_of(rank: int) -> float:
        if rank == 1:
            return 100.0
        return round(100.0 * (1.0 - rank / TOTAL_WORDS), 1)

    @staticmethod
    def get_hot_cold(rank: int) -> str:
        if rank == 1:
            return "🎯 Exact!"
        pct = rank / TOTAL_WORDS
        if pct <= 0.01:
            return "🔥 Burning"
        if pct <= 0.05:
            return "🔥 Hot"
        if pct <= 0.15:
            return "☀️ Warm"
        if pct <= 0.35:
            return "🌤️ Lukewarm"
        if pct <= 0.60:
            return "❄️ Cold"
        return "🧊 Freezing"

    def get_hint_for_last_guess(self) -> tuple[str, float]:
        last_idx = WORD_TO_IDX[self.guesses[-1]]
        current_sim = float(self.similarities[last_idx])
        goal_sim = current_sim + HINT_FACTOR * (1.0 - current_sim)

        diffs = np.abs(self.similarities - goal_sim)
        diffs[self.target_idx] = np.inf
        for w in self.guesses:
            diffs[WORD_TO_IDX[w]] = np.inf

        hint_idx = int(np.argmin(diffs))
        hint_sim = round(float(self.similarities[hint_idx]) * 100, 2)
        return WORD_NAMES[hint_idx], hint_sim


# ------------------------------------------------------------------ #
#  Schemas
# ------------------------------------------------------------------ #

class StartGameResponse(BaseModel):
    game_id: str
    total_words: int
    target_category: str


class GuessRequest(BaseModel):
    game_id: str
    word: str


class GuessResponse(BaseModel):
    word: str
    input_word: str
    similarity: float
    percentile: float
    hot_cold: str
    guess_number: int
    is_correct: bool
    word_category: str
    category_match: bool


class HintRequest(BaseModel):
    game_id: str


class HintResponse(BaseModel):
    hint_word: str
    hint_similarity: float


class GiveUpResponse(BaseModel):
    target_word: str
    total_guesses: int


# ------------------------------------------------------------------ #
#  Endpoints
# ------------------------------------------------------------------ #

@router.post("/start", response_model=StartGameResponse)
async def start_game():
    game = GameState()
    with _games_lock:
        _games[game.game_id] = game
    print(f"Game {game.game_id[:8]}… target: '{game.target_word}' ({game.target_category})")
    return StartGameResponse(
        game_id=game.game_id,
        total_words=TOTAL_WORDS,
        target_category=game.target_category,
    )


@router.post("/guess", response_model=GuessResponse)
async def submit_guess(req: GuessRequest):
    with _games_lock:
        game = _games.get(req.game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found. Start a new game.")

    raw = req.word.lower().strip()
    word = _lemmatize(raw)

    if word not in WORD_TO_IDX:
        msg = f"'{raw}' is not in the vocabulary."
        if word != raw:
            msg = f"'{raw}' (base form: '{word}') is not in the vocabulary."
        raise HTTPException(status_code=400, detail=msg)

    if word in game.guesses:
        raise HTTPException(status_code=400, detail=f"You already guessed '{word}'.")

    idx = WORD_TO_IDX[word]
    similarity = round(float(game.similarities[idx]) * 100, 2)
    rank = game.rank_of[idx]
    percentile = GameState.percentile_of(rank)
    hot_cold = GameState.get_hot_cold(rank)
    word_category = WORD_CATEGORIES[idx]
    category_match = word_category == game.target_category

    game.guesses.append(word)

    is_correct = rank == 1
    if is_correct:
        with _games_lock:
            _games.pop(req.game_id, None)

    return GuessResponse(
        word=word,
        input_word=raw,
        similarity=similarity,
        percentile=percentile,
        hot_cold=hot_cold,
        guess_number=len(game.guesses),
        is_correct=is_correct,
        word_category=word_category,
        category_match=category_match,
    )


@router.post("/hint", response_model=HintResponse)
async def get_hint(req: HintRequest):
    with _games_lock:
        game = _games.get(req.game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found.")
    if not game.guesses:
        raise HTTPException(status_code=400, detail="Make at least one guess first.")

    hint_word, hint_sim = game.get_hint_for_last_guess()
    return HintResponse(hint_word=hint_word, hint_similarity=hint_sim)


@router.post("/give_up", response_model=GiveUpResponse)
async def give_up(req: HintRequest):
    with _games_lock:
        game = _games.pop(req.game_id, None)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found.")
    return GiveUpResponse(target_word=game.target_word, total_guesses=len(game.guesses))