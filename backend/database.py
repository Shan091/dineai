import os

import motor.motor_asyncio
from dotenv import load_dotenv

# Load backend/.env if present (real environment variables take precedence).
load_dotenv()

# Connection string comes from MONGO_URL; defaults to a local MongoDB for development.
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "dine_ai"

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]
