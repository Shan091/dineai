from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
import uuid
from typing import List, Optional

# LOCAL IMPORTS
from database import db
from models import MenuItem, Order, OrderCreate, OrderItem

app = FastAPI(title="DineAI Backend")

# --- CORS CONFIGURATION (Security Bridge) ---
import os
origins = [
    "http://localhost:5173",    # Vite Dev Server
    "http://127.0.0.1:5173",    # Vite Dev Server (IP)
    "http://localhost:4173",    # Vite Preview (Production test)
    "http://127.0.0.1:4173",    # Vite Preview (IP)
]

# Add production frontend URL if set
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)
    # Also allow Vercel preview deployments (optional, but helpful)
    origins.append("https://*.vercel.app") 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],        # Allow all methods (GET, POST, PUT, DELETE)
    allow_headers=["*"],        # Allow all headers
)

# --- STARTUP: SEED DATA ---
@app.on_event("startup")
async def seed_data():
    count = await db.menu.count_documents({})
    if count == 0:
        print("🌱 SEEDING EMPTY DATABASE...")
        initial_menu = [
            MenuItem(
                name="Malabar Chicken Biriyani", description="Aromatic kaima rice cooked with spiced chicken.",
                price=320, category="Mains", image="https://images.unsplash.com/photo-1633945274405-b6c8069047b0",
                dietaryType="non-veg", spiceLevel="medium", tags=["bestseller", "comfort"], isAvailable=True,
                heroIngredient="poultry", allergens=["dairy"], prepTime=25, calories=650, stock=50, rating=4.8
            ),
             MenuItem(
                name="Butter Chicken", description="Creamy tomato curry.",
                price=280, category="Mains", image="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=500&q=80",
                dietaryType="non-veg", spiceLevel="mild", tags=["classic", "kids_friendly"], isAvailable=True,
                heroIngredient="poultry", allergens=["dairy", "treenuts"], prepTime=20, calories=550, stock=30, rating=4.7
            ),
            MenuItem(
                name="Kerala Parotta", description="Flaky layered flatbread.",
                price=40, category="Breads/Rice", image="https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=500&q=80",
                dietaryType="veg", spiceLevel="mild", isAvailable=True,
                heroIngredient="rice", allergens=["gluten"], prepTime=10, calories=300, stock=100, rating=4.9
            ),
             MenuItem(
                name="Fresh Lime Soda", description="Refreshing sweet and salty soda.",
                price=80, category="Beverages", image="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
                dietaryType="veg", spiceLevel="mild", isAvailable=True,
                heroIngredient="veg", allergens=[], prepTime=5, calories=120, stock=100, rating=4.5
            ),
            MenuItem(
                name="Gobi Manchurian", description="Crispy cauliflower in tangy soy-garlic sauce.",
                price=240, category="Starters", image="https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=1000",
                dietaryType="veg", spiceLevel="medium", isAvailable=True, tags=["vegan", "comfort"],
                heroIngredient="veg", allergens=["soy", "gluten"], prepTime=20, calories=290, stock=20, rating=4.6
            ),
            MenuItem(
                name="Beef Fry", description="Spicy stir-fried beef with coconut slices.",
                price=380, category="Mains", image="https://images.unsplash.com/photo-1626509673367-1605553049b6?q=80&w=1000",
                dietaryType="non-veg", spiceLevel="fiery", isAvailable=True, tags=["spicy", "high_protein", "keto"],
                heroIngredient="red_meat", allergens=[], prepTime=25, calories=450, stock=15, rating=4.8
            ),
             MenuItem(
                name="Palada Payasam", description="Sweet rice pasta pudding with milk.",
                price=180, category="Dessert", image="https://images.unsplash.com/photo-1628169604754-583b6329007f?q=80&w=1000",
                dietaryType="veg", spiceLevel="mild", isAvailable=True, tags=["sweet", "classic"],
                heroIngredient="rice", allergens=["dairy", "gluten"], prepTime=5, calories=350, stock=25, rating=4.9
            )
        ]
        # Insert all
        await db.menu.insert_many([item.model_dump(by_alias=True, exclude=["id"]) for item in initial_menu])
        print("✅ SEEDED 4 ITEMS")

@app.get("/")
def health_check():
    return {"status": "online", "system": "DineAI Mongo Core"}

# --- MENU ROUTES ---
@app.get("/api/menu", response_model=List[MenuItem], response_model_by_alias=False)
async def get_menu():
    return await db.menu.find().to_list(1000)

@app.post("/api/menu", response_model=MenuItem, response_model_by_alias=False)
async def add_menu_item(item: MenuItem):
    # Exclude ID so Mongo generates it
    new_item = await db.menu.insert_one(item.model_dump(by_alias=True, exclude=["id"]))
    created_item = await db.menu.find_one({"_id": new_item.inserted_id})
    return created_item

@app.patch("/api/menu/{item_id}", response_model=MenuItem, response_model_by_alias=False)
async def update_menu_item(item_id: str, updates: dict):
    # Convert string ID to ObjectId isn't strictly needed if we query by string if we stored as string
    # But wait, PyObjectId stores as ObjectId in DB? 
    # Yes, PyObjectId logic handles validation. But for find_one with _id, we might need ObjectId(id) wrapper
    # unless motor does it automatically? Motor/Pymongo usually expects ObjectId.
    # The Helper PyObjectId validates string -> ObjectId suitable for Pydantic.
    # But for search queries? We should probably try-catch ObjectId conversion.
    # actually, with PyObjectId, it might be safer to let Pydantic handle it?
    # Simple MVP approach: Pymongo needs ObjectId.
    
    # Let's import ObjectId
    from bson import ObjectId
    try:
        oid = ObjectId(item_id)
    except:
        raise HTTPException(400, "Invalid ID format")

    await db.menu.update_one({"_id": oid}, {"$set": updates})
    updated = await db.menu.find_one({"_id": oid})
    if updated: return updated
    raise HTTPException(404, "Item not found")

@app.patch("/api/menu/{item_id}/toggle", response_model=MenuItem, response_model_by_alias=False)
async def toggle_item(item_id: str):
    from bson import ObjectId
    try:
        oid = ObjectId(item_id)
    except:
        raise HTTPException(400, "Invalid ID")
        
    item = await db.menu.find_one({"_id": oid})
    if not item: raise HTTPException(404, "Not Found")
    
    new_status = not item.get("isAvailable", True)
    await db.menu.update_one({"_id": oid}, {"$set": {"isAvailable": new_status}})
    return await db.menu.find_one({"_id": oid})

@app.delete("/api/menu/{item_id}")
async def delete_menu_item(item_id: str):
    from bson import ObjectId
    try:
        oid = ObjectId(item_id)
    except:
        raise HTTPException(400, "Invalid ID")
    
    result = await db.menu.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Item not found")
    return {"status": "deleted", "id": item_id}

# --- Helper: Convert MongoDB order to JSON-safe dict ---
def serialize_order(order: dict) -> dict:
    """Convert MongoDB order document to JSON-serializable format"""
    if not order:
        return order
    result = {**order}
    if "_id" in result:
        result["id"] = str(result.pop("_id"))
    return result

def serialize_orders(orders: list) -> list:
    """Convert list of MongoDB orders to JSON-serializable format"""
    return [serialize_order(o) for o in orders]

# --- ORDER ROUTES ---
@app.post("/api/orders")
async def place_order(order_in: OrderCreate):
    # 1. Check for existing ACTIVE session (not paid/cancelled)
    existing_order = await db.orders.find_one({
        "tableId": order_in.tableId,
        "status": {"$nin": ["paid", "cancelled"]}
    })

    if existing_order:
        print(f"🔄 MERGING ORDER: Table {order_in.tableId} adding items...")
        
        # 2. Prepare Updates
        # Convert new items to dict
        new_items_data = [item.model_dump() for item in order_in.items]
        
        # EXPLICIT APPEND: Ensure we extend the list, not replace it.
        # Although list + list works, let's be verbose for clarity.
        current_items = list(existing_order.get('items', []))
        current_items.extend(new_items_data)
        updated_items = current_items
        
        # 3. Recalculate Totals (Backend Source of Truth)
        # Calculate Subtotal
        # Assuming item['price'] is UNIT price.
        # Safest is to sum (price * quantity) for all items in the accumulated list.
        # Let's verify standard usage. In `models.py`, `MenuItem` has `price`. `OrderItem` has `price`.
        # Usually `OrderItem.price` copies `MenuItem.price`.
        subtotal = sum(item['price'] * item['quantity'] for item in updated_items)
        
        gst_rate = 0.05
        service_rate = 0.025
        
        gst_amount = subtotal * gst_rate
        service_amount = subtotal * service_rate
        
        final_total = subtotal + gst_amount + service_amount
        
        print(f"💰 RESYNC TOTALS: Sub: {subtotal}, GST: {gst_amount}, Svc: {service_amount}, Total: {final_total}")

        # 4. Perform Update
        # Reset status to 'placed' so kitchen sees the 'new' request
        await db.orders.update_one(
            {"_id": existing_order["_id"]},
            {
                "$set": {
                    "items": updated_items,
                    "totalAmount": final_total,
                    "status": "placed", 
                    "guestName": order_in.guestName 
                }
            }
        )
        
        # 4. Return Updated Doc
        result = await db.orders.find_one({"_id": existing_order["_id"]})
        return serialize_order(result)

    else:
        # --- NEW ORDER LOGIC ---
        new_order_data = {
            "createdAt": datetime.now().isoformat(),
            "status": "placed",
            "tableId": order_in.tableId,
            "items": [item.model_dump() for item in order_in.items],
            "guestName": order_in.guestName,
            "totalAmount": order_in.totalAmount or 0,
            "type": order_in.type or "food"  # Default to 'food' for kitchen display
        }
        
        result = await db.orders.insert_one(new_order_data)
        created_order = await db.orders.find_one({"_id": result.inserted_id})
        print(f"🔔 NEW ORDER: {order_in.guestName} (Table {order_in.tableId})")
        return serialize_order(created_order)

@app.get("/api/orders")
async def get_orders(status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    orders = await db.orders.find(query).to_list(1000)
    return serialize_orders(orders)

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str):
    from bson import ObjectId
    try:
        oid = ObjectId(order_id)
    except:
        raise HTTPException(400, "Invalid ID")
    
    order = await db.orders.find_one({"_id": oid})
    if not order:
        raise HTTPException(404, "Order not found")
    return serialize_order(order)

@app.patch("/api/orders/{order_id}/status")
async def update_status(order_id: str, status: str):
    from bson import ObjectId
    try:
        oid = ObjectId(order_id)
    except:
        raise HTTPException(400, "Invalid ID")

    # Fetch existing
    existing = await db.orders.find_one({"_id": oid})
    if not existing:
         raise HTTPException(404, "Order not found")

    updated_items = existing.get('items', [])
    
    # --- ITEM LEVEL TRANSITIONS ---
    # "Mark Ready" (Kitchen): Pending -> Ready
    if status == 'ready':
        for item in updated_items:
            if item.get('status', 'pending') == 'pending':
                item['status'] = 'ready'
                
    # "Mark Served" (Service): Ready -> Served
    elif status == 'served':
        for item in updated_items:
            # Service dashboard sees 'ready' items and serves them
            if item.get('status', 'pending') == 'ready':
                item['status'] = 'served'

    # --- PARENT STATUS RECALC ---
    # Determine visibility tag based on active items
    has_pending = any(i.get('status', 'pending') == 'pending' for i in updated_items)
    has_ready = any(i.get('status', 'pending') == 'ready' for i in updated_items)
    
    # Priority: Placed (Kitchen) > Ready (Service) > Served (Done)
    new_parent_status = 'served' 
    if has_pending:
        new_parent_status = 'placed'
    elif has_ready:
        new_parent_status = 'ready'
    
    # Update DB
    await db.orders.update_one(
        {"_id": oid}, 
        {
            "$set": {
                "status": new_parent_status,
                "items": updated_items
            }
        }
    )
    
    updated = await db.orders.find_one({"_id": oid})
    if updated: 
        return serialize_order(updated)
    raise HTTPException(404, "Order not found")

@app.post("/api/tables/{table_id}/settle")
async def settle_table(table_id: str):
    try:
        t_id = int(table_id)
    except ValueError:
        raise HTTPException(400, "Invalid Table ID")
        
    # Update many
    result = await db.orders.update_many(
        {"tableId": t_id, "status": {"$ne": "paid"}},  # Query
        {"$set": {"status": "paid"}}                    # Update
    )
    
    print(f"💰 SETTLED TABLE {t_id}: {result.modified_count} orders cleared")
    return {"status": "cleared", "count": result.modified_count}

@app.get("/api/tables/{table_id}/session")
async def get_session(table_id: str):
    try:
        t_id = int(table_id)
    except ValueError:
        raise HTTPException(400, "Invalid Table ID")

    # Find latest active order
    # Sort by _id desc (approx timestamp)
    cursor = db.orders.find(
        {"tableId": t_id, "status": {"$nin": ["paid", "cancelled"]}}
    ).sort("_id", -1).limit(1)
    
    active_orders = await cursor.to_list(length=1)
    

    if active_orders:
        o = active_orders[0]
        return {
            "active": True,
            "guestName": o.get("guestName"),
            "tableId": table_id,
            "orderId": str(o["_id"]),
            "status": o.get("status")
        }
    return {"active": False}

# --- USER ROUTES ---
from models import User, UserLogin, UserCheck

@app.post("/api/users/check")
async def check_user(check: UserCheck):
    user = await db.users.find_one({"phone": check.phone})
    if user:
        return {"exists": True, "name": user["name"]}
    return {"exists": False}

@app.post("/api/users/login")
async def login_user(login_data: UserLogin):
    try:
        # 1. Validation Logic
        if not login_data.phone:
            raise HTTPException(status_code=400, detail="Phone is required")

        # UPSERT LOGIC
        # 2. Try to find by phone
        existing_user = await db.users.find_one({"phone": login_data.phone})

        from datetime import datetime
        
        if existing_user:
            # 3. CASE A: User Exists -> Update Stats & Prefs
            print(f"✅ Existing User Logged In: {existing_user.get('name')}")
            
            update_data = {
                "lastVisit": datetime.now().isoformat()
            }
            if login_data.name:
                update_data["name"] = login_data.name
            
            # If preferences are passed, update them (MERGE or REPLACE? Let's Replace for simplicity/consistency with Wizard)
            if login_data.preferences:
                 update_data["preferences"] = login_data.preferences

            # Atomic increment
            await db.users.update_one(
                {"_id": existing_user["_id"]},
                {
                    "$set": update_data,
                    "$inc": {"visitCount": 1}
                }
            )
            result = await db.users.find_one({"_id": existing_user["_id"]})
            # Convert ObjectId to string for JSON serialization
            result["id"] = str(result.pop("_id"))
            return result
        else:
            # 4. CASE B: New User -> Create
            print(f"🆕 Creating New User: {login_data.name}")
            new_user_data = {
                "name": login_data.name or "Guest",
                "phone": login_data.phone,
                "preferences": login_data.preferences or {},
                "visitCount": 1,
                "lastVisit": datetime.now().isoformat()
            }
            insert_result = await db.users.insert_one(new_user_data)
            result = await db.users.find_one({"_id": insert_result.inserted_id})
            # Convert ObjectId to string for JSON serialization
            result["id"] = str(result.pop("_id"))
            return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Login Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}", response_model=User, response_model_by_alias=False)
async def get_user_details(user_id: str):
    from bson import ObjectId
    try:
        oid = ObjectId(user_id)
    except:
        raise HTTPException(400, "Invalid ID")
    
    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(404, "User not found")
    return user

@app.put("/api/users/{user_id}/preferences", response_model=User, response_model_by_alias=False)
async def add_preference(user_id: str, payload: dict):
    # payload: {"preference": "No Sugar"}
    pref = payload.get("preference")
    if not pref:
         raise HTTPException(400, "Preference required")

    from bson import ObjectId
    try:
        oid = ObjectId(user_id)
    except:
         raise HTTPException(400, "Invalid ID")

    # Add to set (avoid duplicates)
    await db.users.update_one(
        {"_id": oid},
        {"$addToSet": {"preferences": pref}}
    )
    return await db.users.find_one({"_id": oid})

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)