from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    FRONTEND_URL: str = "http://localhost:3000"

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/callback"

    # LLM provider (any OpenAI-compatible API: Gemini, Groq, OpenRouter, OpenAI, ...)
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    LLM_MODEL: str = "gemini-2.5-flash"

    SECRET_KEY: str = "change-me"

    class Config:
        env_file = ".env"


settings = Settings()
