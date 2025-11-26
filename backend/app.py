from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import lm_apis, planner_apis, chess_apis, openrouter_apis

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lm_apis.router)
app.include_router(planner_apis.router)
app.include_router(chess_apis.router)
app.include_router(openrouter_apis.router)
