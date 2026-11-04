from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", validation_alias="GEMINI_MODEL")
    gemini_timeout_seconds: float = Field(default=45.0, validation_alias="GEMINI_TIMEOUT_SECONDS")
    # /docs, /redoc e /openapi.json só com DOCS_ENABLED=true.
    docs_enabled: bool = Field(default=False, validation_alias="DOCS_ENABLED")

    rabbitmq_enabled: bool = Field(default=True, validation_alias="RABBITMQ_ENABLED")
    rabbitmq_host: str = Field(default="localhost", validation_alias="RABBITMQ_HOST")
    rabbitmq_port: int = Field(default=5672, validation_alias="RABBITMQ_PORT")
    rabbitmq_user: str = Field(default="sabia", validation_alias="RABBITMQ_USER")
    rabbitmq_pass: str = Field(default="sabia", validation_alias="RABBITMQ_PASS")
    rabbitmq_vhost: str = Field(default="/", validation_alias="RABBITMQ_VHOST")
    rabbitmq_retry_max_attempts: int = Field(default=3, validation_alias="RABBITMQ_RETRY_MAX_ATTEMPTS")
    rabbitmq_retry_initial_interval: float = Field(
        default=2.0, validation_alias="RABBITMQ_RETRY_INITIAL_INTERVAL_SECONDS"
    )

    model_config = SettingsConfigDict(extra="ignore")


settings = Settings()