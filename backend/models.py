from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Any, Annotated
from datetime import datetime

# --- PyObjectId Helper ---
# This helps Pydantic handle MongoDB's _id field automatically
PyObjectId = Annotated[str, BeforeValidator(str)]

# ==========================
# 1. USER MODELS
# ==========================
class UserPreferences(BaseModel):
    moods: List[str] = []
    goals: List[str] = []
    dietType: str = "non-veg"
    allergies: List[str] = []

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    phone: str
    preferences: Optional[dict] = Field(default_factory=dict)  # Flexible dict for preferences
    visitCount: int = 1
    lastVisit: Optional[str] = None

    class Config:
        populate_by_name = True

class UserLogin(BaseModel):
    name: Optional[str] = None  # Made optional to prevent 422 error
    phone: str
    preferences: Optional[dict] = None  # Optional structured preferences

class UserCheck(BaseModel):
    phone: str

# ==========================
# 2. MENU MODELS
# ==========================
class MenuItem(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    description: Optional[str] = None
    price: float
    category: str
    image: Optional[str] = None
    spiceLevel: Optional[str] = None
    isAvailable: bool = True
    dietaryType: Optional[str] = "veg"
    tags: List[str] = []
    heroIngredient: Optional[str] = None
    allergens: List[str] = []
    prepTime: Optional[int] = None
    calories: Optional[int] = None
    stock: Optional[int] = None
    rating: Optional[float] = None

    class Config:
        populate_by_name = True

# ==========================
# 3. ORDER MODELS
# ==========================
class OrderItem(BaseModel):
    # menu_item_id is optional because old data doesn't have it
    menu_item_id: Optional[str] = None
    name: str
    price: float
    quantity: int
    notes: Optional[str] = ""
    status: Optional[str] = "pending"  # Item-level status

class OrderCreate(BaseModel):
    tableId: int  # Match the DB field name directly
    items: List[OrderItem]
    guestName: Optional[str] = None  # Match DB field
    totalAmount: Optional[float] = None
    type: Optional[str] = "food"  # 'food' or 'request'

class Order(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    tableId: int
    items: List[OrderItem]
    guestName: Optional[str] = None
    status: str = "pending"
    totalAmount: Optional[float] = None
    createdAt: Optional[str] = None
    type: Optional[str] = "food"  # 'food' or 'request'

    class Config:
        populate_by_name = True