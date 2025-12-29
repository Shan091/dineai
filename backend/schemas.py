from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime

# --- 1. Menu Models (Mirrors MenuItem in SmartMenu.tsx) ---
class MenuItem(BaseModel):
    id: str
    name: str
    description: str
    price: float
    category: str
    image: str
    isAvailable: bool = True  # Critical for Inventory Toggles
    type: Literal['unit', 'portion'] = 'unit'
    
    # dietary/tags
    dietaryType: Literal['veg', 'non-veg', 'egg']
    spiceLevel: Literal['mild', 'medium', 'fiery']
    tags: List[str] = []
    allergens: List[str] = []
    
    # Metadata
    prepTime: int = 15
    calories: int = 0
    rating: float = 4.5

# --- 2. Order Models (Mirrors OrderTicket in App.tsx) ---
class OrderItem(BaseModel):
    name: str
    quantity: int
    notes: Optional[str] = None
    price: float  # Backend must validate price, but useful for snapshot

class OrderCreate(BaseModel):
    tableId: str
    guestName: str = "Guest"
    items: List[OrderItem]
    totalAmount: float
    type: Literal['food', 'request'] = 'food'

class Order(OrderCreate):
    id: str
    status: Literal['new', 'received', 'cooking', 'ready', 'served', 'paid'] = 'new'
    timestamp: datetime
    
# --- 3. Session/Table Models ---
class TableSession(BaseModel):
    tableId: str
    status: Literal['available', 'occupied', 'payment_pending']
    currentOrderId: Optional[str] = None
    guestName: Optional[str] = None