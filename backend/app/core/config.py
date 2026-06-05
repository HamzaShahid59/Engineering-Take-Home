from pydantic_settings import BaseSettings


# Keeps environment-based configuration in one place.
class Settings(BaseSettings):
    MONGO_URI: str
    DATABASE_NAME: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    IMAGEKIT_PUBLIC_KEY: str
    IMAGEKIT_PRIVATE_KEY: str
    IMAGEKIT_URL_ENDPOINT: str

    class Config:
        env_file = ".env"


settings = Settings()