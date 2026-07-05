from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    FRONTEND_URL: str = "http://localhost:3000"

    # Google OAuth / Gmail API
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/callback"

    # AI provider
    ANTHROPIC_API_KEY: str = ""

    # Session / JWT
    SECRET_KEY: str = "change-me"

    class Config:
        env_file = ".env"


settings = Settings()
