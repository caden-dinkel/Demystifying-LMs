"""
Word Association Game API — v5 (stateless)
Game state is encoded in the game_id token. No server-side storage.
Works across any number of backend replicas without sticky sessions.
"""

from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
import torch
import torch.nn.functional as F
import numpy as np
import random
import hmac
import hashlib
import base64

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
    if not valid:
        return word
    return min(valid, key=lambda c: (len(c), c))



# ------------------------------------------------------------------ #
#  Word categories via WordNet lexicographer file names
# ------------------------------------------------------------------ #

_LEXNAME_TO_CATEGORY: dict[str, str] = {
    "noun.animal": "Animal",
    "noun.plant": "Nature",
    "noun.phenomenon": "Nature",
    "noun.substance": "Nature",
    "verb.weather": "Nature",
    "noun.person": "Person",
    "noun.group": "Person",
    "noun.body": "Person",
    "verb.body": "Person",
    "verb.social": "Person",
    "noun.artifact": "Object",
    "noun.object": "Object",
    "noun.possession": "Object",
    "verb.possession": "Object",
    "noun.location": "Place",
    "noun.food": "Food",
    "verb.consumption": "Food",
    "noun.cognition": "Mind",
    "noun.feeling": "Mind",
    "noun.state": "Mind",
    "noun.motive": "Mind",
    "verb.cognition": "Mind",
    "verb.emotion": "Mind",
    "verb.perception": "Mind",
    "noun.communication": "Communication",
    "verb.communication": "Communication",
    "noun.act": "Action",
    "noun.event": "Action",
    "noun.process": "Action",
    "verb.motion": "Action",
    "verb.contact": "Action",
    "verb.competition": "Action",
    "verb.creation": "Action",
    "verb.change": "Action",
    "noun.attribute": "Descriptor",
    "noun.shape": "Descriptor",
    "noun.relation": "Descriptor",
    "verb.stative": "Descriptor",
    "adj.all": "Descriptor",
    "adj.pert": "Descriptor",
    "adj.ppl": "Descriptor",
    "adv.all": "Descriptor",
    "noun.quantity": "Measurement",
    "noun.time": "Measurement",
    "noun.Tops": "General",
}

_DEFAULT_CATEGORY = "General"


def _get_category(word: str) -> str:
    synsets = wn.synsets(word)
    if not synsets:
        return _DEFAULT_CATEGORY
    return _LEXNAME_TO_CATEGORY.get(synsets[0].lexname(), _DEFAULT_CATEGORY)


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

print("Word Game: assigning categories…")
WORD_CATEGORIES: list[str] = [_get_category(w) for w in WORD_NAMES]
print(
    f"Word Game: {TOTAL_WORDS} words loaded across "
    f"{len(set(WORD_CATEGORIES))} categories."
)

HINT_FACTOR = 0.10

# ------------------------------------------------------------------ #
#  Stateless game-id token  (HMAC-signed target index)
# ------------------------------------------------------------------ #

_GAME_SECRET = b"dmlm-word-game-v5-secret"


def _encode_game_id(target_idx: int) -> str:
    payload = str(target_idx).encode()
    sig = hmac.new(_GAME_SECRET, payload, hashlib.sha256).hexdigest()[:16]
    return base64.urlsafe_b64encode(f"{target_idx}:{sig}".encode()).decode()


def _decode_game_id(game_id: str) -> int:
    try:
        decoded = base64.urlsafe_b64decode(game_id.encode()).decode()
        idx_str, sig = decoded.rsplit(":", 1)
        expected = hmac.new(
            _GAME_SECRET, idx_str.encode(), hashlib.sha256
        ).hexdigest()[:16]
        if not hmac.compare_digest(sig, expected):
            raise ValueError()
        idx = int(idx_str)
        if idx < 0 or idx >= TOTAL_WORDS:
            raise ValueError()
        return idx
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired game ID.")


# ------------------------------------------------------------------ #
#  Helpers (recomputed per request — fast for 10k words)
# ------------------------------------------------------------------ #


def _compute_similarities(target_idx: int) -> np.ndarray:
    target_emb = _word_embeddings_norm[target_idx]
    return torch.mv(_word_embeddings_norm, target_emb).numpy()


def _rank_of(sims: np.ndarray, word_idx: int) -> int:
    """1-based rank: how many words have strictly higher similarity + 1."""
    return int((sims > sims[word_idx]).sum()) + 1


def _percentile_of(rank: int) -> float:
    if rank == 1:
        return 100.0
    return round(100.0 * (1.0 - rank / TOTAL_WORDS), 1)


def _hot_cold(rank: int) -> str:
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
    is_correct: bool
    word_category: str
    category_match: bool


class HintRequest(BaseModel):
    game_id: str
    last_guess: str
    previous_guesses: list[str] = []


class HintResponse(BaseModel):
    hint_word: str
    hint_similarity: float


class GiveUpRequest(BaseModel):
    game_id: str


class GiveUpResponse(BaseModel):
    target_word: str


# ------------------------------------------------------------------ #
#  Endpoints
# ------------------------------------------------------------------ #


@router.post("/start", response_model=StartGameResponse)
async def start_game():
    target_idx = random.randint(0, TOTAL_WORDS - 1)
    game_id = _encode_game_id(target_idx)
    print(f"Game started — target: '{WORD_NAMES[target_idx]}' ({WORD_CATEGORIES[target_idx]})")
    return StartGameResponse(
        game_id=game_id,
        total_words=TOTAL_WORDS,
        target_category=WORD_CATEGORIES[target_idx],
    )


@router.post("/guess", response_model=GuessResponse)
async def submit_guess(req: GuessRequest):
    target_idx = _decode_game_id(req.game_id)

    raw = req.word.lower().strip()
    word = _lemmatize(raw)

    if word not in WORD_TO_IDX:
        msg = f"'{raw}' is not in the vocabulary."
        if word != raw:
            msg = f"'{raw}' (base form: '{word}') is not in the vocabulary."
        raise HTTPException(status_code=400, detail=msg)

    idx = WORD_TO_IDX[word]
    sims = _compute_similarities(target_idx)

    similarity = round(float(sims[idx]) * 100, 2)
    rank = _rank_of(sims, idx)
    percentile = _percentile_of(rank)
    hot_cold_label = _hot_cold(rank)
    word_category = WORD_CATEGORIES[idx]
    category_match = word_category == WORD_CATEGORIES[target_idx]
    is_correct = idx == target_idx

    return GuessResponse(
        word=word,
        input_word=raw,
        similarity=similarity,
        percentile=percentile,
        hot_cold=hot_cold_label,
        is_correct=is_correct,
        word_category=word_category,
        category_match=category_match,
    )


@router.post("/hint", response_model=HintResponse)
async def get_hint(req: HintRequest):
    target_idx = _decode_game_id(req.game_id)

    last_word = _lemmatize(req.last_guess.lower().strip())
    if last_word not in WORD_TO_IDX:
        raise HTTPException(status_code=400, detail="Last guess not recognised.")

    sims = _compute_similarities(target_idx)

    last_idx = WORD_TO_IDX[last_word]
    current_sim = float(sims[last_idx])
    goal_sim = current_sim + HINT_FACTOR * (1.0 - current_sim)

    diffs = np.abs(sims - goal_sim)
    diffs[target_idx] = np.inf

    for w in req.previous_guesses:
        lemma = _lemmatize(w.lower().strip())
        if lemma in WORD_TO_IDX:
            diffs[WORD_TO_IDX[lemma]] = np.inf

    hint_idx = int(np.argmin(diffs))
    hint_sim = round(float(sims[hint_idx]) * 100, 2)
    return HintResponse(hint_word=WORD_NAMES[hint_idx], hint_similarity=hint_sim)


@router.post("/give_up", response_model=GiveUpResponse)
async def give_up(req: GiveUpRequest):
    target_idx = _decode_game_id(req.game_id)
    return GiveUpResponse(target_word=WORD_NAMES[target_idx])
