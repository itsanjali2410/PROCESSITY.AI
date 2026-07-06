import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.routes import auth, emails, assistant, realtime


@asynccontextmanager
async def lifespan(app: FastAPI):
    poller = asyncio.create_task(realtime.poll_inbox())
    yield
    poller.cancel()


app = FastAPI(title="Processity Mail API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(emails.router, prefix="/emails", tags=["emails"])
app.include_router(assistant.router, prefix="/assistant", tags=["assistant"])
app.include_router(realtime.router, prefix="/realtime", tags=["realtime"])


@app.get("/health")
def health():
    return {"status": "ok"}
