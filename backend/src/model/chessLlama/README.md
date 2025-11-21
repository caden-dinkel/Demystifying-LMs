---
datasets:
- lazy-guy12/checkmate2
pipeline_tag: text-generation
library_name: transformers
---
We trained a tiny Llama-based decoder-only transformer model for chess play, consisting of 23M parameters.
The model is trained on a 3 million high-quality chess games from the Lichess Elite Database, on a single Nvidia L4 GPU for 18 hours, using the Google Cloud’s Vertex AI platform.

It uses the UCI format for input and output. It has been trained with the token indicating result appended to the beginning of the games, hoping it would improve performance during actual chess play.
The model achieves an estimated Elo rating of 1400, and easily outperforms Skill-level 0 Stockfish.

You can try it out [here](https://lazy-guy.github.io/chess-llama/)! It runs directly on your device, within the browser, thanks to transformers.js.

Todo:
- [x] Upload model to Hugging Face
- [ ] Add inference scripts for proper chess play
- [x] Integrate it into a webui, possibly by using transformers.js

Blogpost - [https://lazy-guy.github.io/blog/chessllama/](https://lazy-guy.github.io/blog/chessllama/)
