const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually load .env and .env.local
const loadEnv = (filePath) => {
    console.log(`Checking env at: ${filePath}`);
    if (fs.existsSync(filePath)) {
        console.log(`Found ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf8');
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.trim().startsWith('#')) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    } else {
        console.log(`Missing ${filePath}`);
    }
};

loadEnv(path.resolve(__dirname, '../.env'));
loadEnv(path.resolve(__dirname, '../.env.local'));
console.log('MONGO_URI Present:', !!process.env.MONGO_URI);

// Define Menu Schema (Mirroring backend/models.py)
const menuSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    dietaryType: { type: String, enum: ['veg', 'non-veg', 'egg'], default: 'veg' },
    spiceLevel: { type: String, enum: ['mild', 'medium', 'fiery'], default: 'medium' },
    tags: [String],

    // Rich Data Fields
    heroIngredient: { type: String, default: 'veg' },
    allergens: [String],
    prepTime: { type: Number, default: 15 },
    calories: { type: Number, default: 0 },
    stock: { type: Number, default: 100 },
    rating: { type: Number, default: 4.5 }
});

const Menu = mongoose.model('Menu', menuSchema, 'menu'); // Collection 'menu'

const items = [
    {
        name: "Grilled Paneer Tikka",
        category: "Starter",
        price: 280,
        description: "Fresh cottage cheese cubes marinated in hung curd and tandoori spices, grilled until smoky. High protein and gluten-free.",
        tags: ["vegetarian", "high-protein", "spicy", "keto", "gluten-free"],
        image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800",
        available: true,
        // Inferred Fields
        heroIngredient: 'veg',
        dietaryType: 'veg',
        spiceLevel: 'medium',
        allergens: ['dairy']
    },
    {
        name: "Prawns Roast (Nadan Style)",
        category: "Main Course",
        price: 550,
        description: "Spicy Kerala-style prawns stir-fried with coconut slivers, curry leaves, and pot tamarind. A spicy seafood delicacy.",
        tags: ["non-veg", "spicy", "seafood", "contains-shellfish", "high-protein"],
        image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=800",
        available: true,
        // Inferred Fields
        heroIngredient: 'seafood',
        dietaryType: 'non-veg',
        spiceLevel: 'fiery',
        allergens: ['shellfish']
    },
    {
        name: "Sugar-Free Coconut Mousse",
        category: "Dessert",
        price: 220,
        description: "A light and airy coconut cream mousse sweetened with stevia. The perfect guilt-free finish.",
        tags: ["dessert", "vegetarian", "sugar-free", "keto", "sweet"],
        image: "https://images.unsplash.com/photo-1544464522-834479e00511?auto=format&fit=crop&w=800",
        available: true,
        // Inferred Fields
        heroIngredient: 'veg',
        dietaryType: 'veg',
        spiceLevel: 'mild',
        allergens: []
    }
];

const seedDB = async () => {
    try {
        // Try MONGO_URI, then MONGO_URL, then Fallback
        const itemUri = process.env.MONGO_URI || process.env.MONGO_URL || "mongodb://localhost:27017/dine_ai";

        console.log(`🔌 Connecting to MongoDB at ${itemUri.replace(/\/\/.*@/, '//***@')}...`); // Mask auth if present
        await mongoose.connect(itemUri);
        console.log('✅ Connected to MongoDB');

        const result = await Menu.insertMany(items);
        console.log(`✅ Permanent Menu Items Added! (${result.length} items)`);

        // Log IDs for verification
        result.forEach(item => console.log(`   - ${item.name} (${item._id})`));

        process.exit();
    } catch (err) {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    }
};

seedDB();
