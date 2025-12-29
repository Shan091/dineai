const testItems = [
    {
        name: "Fiery Chicken Chettinad",
        category: "Main Course",
        description: "A blazing hot chicken curry made with roasted spices and peppercorns. Very Spicy.",
        price: 450,
        dietaryType: "non-veg", // Mapped from tags for backend model compliance if needed, but let's send tags too
        spiceLevel: "fiery",    // Inferred
        isAvailable: true,
        tags: ["spicy", "non-veg", "chicken", "high-protein"],
        image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800"
    },
    {
        name: "Kerala Vegetable Stew",
        category: "Main Course",
        description: "Carrots and beans simmered in fresh coconut milk. Mild and plant-based.",
        price: 320,
        dietaryType: "veg",
        spiceLevel: "mild",
        isAvailable: true,
        tags: ["vegan", "vegetarian", "mild", "gluten-free"],
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800"
    },
    {
        name: "Beef Fry (Keto Special)",
        category: "Starter",
        description: "Slow roasted beef with coconut slivers. High protein, low carb.",
        price: 500,
        dietaryType: "non-veg",
        spiceLevel: "medium",
        isAvailable: true,
        tags: ["keto", "non-veg", "beef", "paleo"],
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800"
    },
    {
        name: "Rich Cashew Korma",
        category: "Main Course",
        description: "Creamy curry made with cashew paste and cream. Contains nuts.",
        price: 380,
        dietaryType: "veg",
        spiceLevel: "mild",
        isAvailable: true,
        tags: ["vegetarian", "contains-nuts", "contains-dairy"],
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800"
    },
    {
        name: "Palada Payasam",
        category: "Dessert",
        description: "Sweet rice pudding with milk and sugar.",
        price: 180,
        dietaryType: "veg",
        spiceLevel: "mild",
        isAvailable: true,
        tags: ["dessert", "sweet", "vegetarian"],
        image: "https://images.unsplash.com/photo-1643904423471-2f73b64c76b9?auto=format&fit=crop&w=800"
    }
];

// Backend URL
const API_URL = "http://localhost:8000/api/menu";

async function seedMenu() {
    console.log("🌱 Starting Database Seed...");

    for (const item of testItems) {
        try {
            // Ensure backend expected fields are present (defaults)
            const payload = {
                ...item,
                // Backend 'MenuItem' model required fields that might be missing in testItems
                // checking main.py: model_dump excludes ID.
                // models.py (not seen but inferred): heroIngredient, allergens, prepTime, calories, stock, rating seem to be in seed_data items.
                // I should probably add defaults to avoid validation errors if they are required.
                heroIngredient: item.tags.includes("chicken") ? "poultry" : item.tags.includes("beef") ? "red_meat" : "veg",
                allergens: [], // Default
                prepTime: 15,
                calories: 300,
                stock: 50,
                rating: 4.5
            };

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Added: ${data.name}`);
            } else {
                const err = await response.text();
                console.error(`❌ Failed to add ${item.name}: ${err}`);
            }
        } catch (error) {
            console.error(`❌ Network Error for ${item.name}:`, error.message);
        }
    }

    console.log("✨ Seeding Complete!");
}

seedMenu();
