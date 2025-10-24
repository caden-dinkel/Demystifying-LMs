from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import lm_apis

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

#Allow for LM function and type to be passed with API.

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lm_apis.router)
