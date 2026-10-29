from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", validation_alias="GEMINI_MODEL")
    gemini_timeout_seconds: float = Field(default=45.0, validation_alias="GEMINI_TIMEOUT_SECONDS")
    # /docs, /redoc e /openapi.json só com DOCS_ENABLED=true.
    docs_enabled: bool = Field(default=False, validation_alias="DOCS_ENABLED")

    model_config = SettingsConfigDict(extra="ignore")


settings = Settings()