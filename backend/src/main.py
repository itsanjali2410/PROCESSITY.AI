from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.routes import auth, emails, assistant, realtime

app = FastAPI(title="Processity Mail API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(emails.router, prefix="/api/emails", tags=["emails"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["assistant"])
app.include_router(realtime.router, prefix="/api/realtime", tags=["realtime"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
