import motor.motor_asyncio
import os

# For MVP, we can hardcode or use env vars.
# Default to localhost for now as per instructions.
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = "dine_ai"

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]
