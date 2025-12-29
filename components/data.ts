
export interface MenuItemSize {
    label: string;
    price: number;
}

export interface MenuItemAddon {
    name: string;
    price: number;
}

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number; // Base price
    category: string;
    image: string;
    spiceLevel: 'mild' | 'medium' | 'fiery';
    heroIngredient: string;
    allergens: string[];
    tags: string[];
    prepTime: number;
    calories: number;
    stock: number;
    rating: number;

    // New Fields
    dietaryType: 'veg' | 'non-veg' | 'egg';
    isAvailable: boolean;

    type: 'unit' | 'portion';
    sizes?: MenuItemSize[];
    addons?: MenuItemAddon[];
    pairingId?: string;

    macros?: {
        calories: number;
        protein: string;
        carbs: string;
        fats?: string;
    };
}

export const MENU_ITEMS: MenuItem[] = [
    // STARTERS
    {
        id: 's1',
        name: 'Chicken 65',
        description: 'Spicy, deep-fried chicken chunks marinated in ginger, lemon, and red chilies.',
        price: 320,
        category: 'Starters',
        image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d29f30?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'fiery',
        heroIngredient: 'poultry',
        allergens: [],
        tags: ['high_protein', 'spicy', 'quick'],
        prepTime: 15,
        calories: 380,
        stock: 20,
        rating: 4.8,
        dietaryType: 'non-veg',
        isAvailable: true,
        type: 'unit',
        pairingId: 'be1',
        macros: { calories: 380, protein: '28g', carbs: '12g', fats: '22g' }
    },
    {
        id: 's2',
        name: 'Gobi Manchurian',
        description: 'Crispy cauliflower florets tossed in a tangy soy-garlic sauce.',
        price: 240,
        category: 'Starters',
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'medium',
        heroIngredient: 'veg',
        allergens: ['soy', 'gluten'],
        tags: ['vegan', 'comfort'],
        prepTime: 20,
        calories: 290,
        stock: 15,
        rating: 4.5,
        dietaryType: 'veg',
        isAvailable: true,
        type: 'unit',
        macros: { calories: 290, protein: '6g', carbs: '35g' }
    },
    {
        id: 's3',
        name: 'Kerala Beef Cutlet',
        description: 'Spiced minced beef patties, breaded and fried to perfection.',
        price: 180,
        category: 'Starters',
        image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'medium',
        heroIngredient: 'red_meat',
        allergens: ['gluten', 'egg'],
        tags: ['high_protein', 'comfort'],
        prepTime: 15,
        calories: 320,
        stock: 8,
        rating: 4.7,
        dietaryType: 'non-veg',
        isAvailable: true,
        type: 'unit',
        pairingId: 'be1',
        macros: { calories: 320, protein: '22g', carbs: '18g' }
    },
    {
        id: 's4',
        name: 'Crispy Prawn Tempura',
        description: 'Spiced batter fried prawns served with a tangy tamarind chutney.',
        price: 550,
        category: 'Starters',
        image: 'https://images.unsplash.com/photo-1625937751969-93e15549723c?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'medium',
        heroIngredient: 'seafood',
        allergens: ['shellfish', 'gluten'],
        tags: ['quick', 'high_protein'],
        prepTime: 12,
        calories: 300,
        stock: 12,
        rating: 4.9,
        dietaryType: 'non-veg',
        isAvailable: true,
        type: 'unit',
        pairingId: 'be1',
        macros: { calories: 300, protein: '24g', carbs: '20g' }
    },

    // MAINS
    {
        id: 'm1',
        name: 'Malabar Chicken Roast',
        description: 'Slow-roasted chicken in a caramelized onion and tomato masala.',
        price: 450,
        category: 'Mains',
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'fiery',
        heroIngredient: 'poultry',
        allergens: [],
        tags: ['high_protein', 'paleo', 'comfort', 'spicy'],
        prepTime: 25,
        calories: 420,
        stock: 18,
        rating: 4.6,
        dietaryType: 'non-veg',
        isAvailable: true,
        type: 'portion',
        sizes: [
            { label: 'Half', price: 280 },
            { label: 'Full', price: 450 }
        ],
        addons: [
            { name: 'Extra Gravy', price: 30 }
        ],
        pairingId: 'b1', // Parotta
        macros: { calories: 420, protein: '35g', carbs: '14g' }
    },
    {
        id: 'm2',
        name: 'Karimeen Pollichathu',
        description: 'Pearl Spot fish marinated in spicy paste, wrapped in banana leaf and grilled.',
        price: 620,
        category: 'Mains',
        image: 'https://images.unsplash.com/photo-1606138656262-50be1939db27?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'fiery',
        heroIngredient: 'seafood',
        allergens: ['fish'],
        tags: ['high_protein', 'keto', 'heart_healthy', 'spicy'],
        prepTime: 30,
        calories: 350,
        stock: 4,
        rating: 4.9,
        dietaryType: 'non-veg',
        isAvailable: true,
        type: 'unit',
        pairingId: 'b2', // Appam
        macros: { calories: 350, protein: '32g', carbs: '5g' }
    },
    {
        id: 'm3',
        name: 'Kerala Vegetable Stew',
        description: 'Mixed vegetables simmered in a delicate coconut milk gravy.',
        price: 320,
        category: 'Mains',
        image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'mild',
        heroIngredient: 'veg',
        allergens: ['treenuts'],
        tags: ['vegan', 'gut_friendly', 'sugar_conscious', 'balanced'],
        prepTime: 15,
        calories: 280,
        stock: 25,
        rating: 4.4,
        dietaryType: 'veg',
        isAvailable: true,
        type: 'portion',
        sizes: [
            { label: 'Bowl', price: 180 },
            { label: 'Full', price: 320 }
        ],
        pairingId: 'b2', // Appam
        macros: { calories: 280, protein: '8g', carbs: '22g' }
    },
    {
        id: 'm4',
        name: 'Butter Chicken',
        description: 'Tandoori chicken simmered in a rich, creamy tomato sauce.',
        price: 480,
        category: 'Mains',
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'mild',
        heroIngredient: 'poultry',
        allergens: ['dairy', 'treenuts'],
        tags: ['comfort', 'protein'],
        prepTime: 20,
        calories: 550,
        stock: 30,
        rating: 4.8,
        dietaryType: 'non-veg',
        isAvailable: true,
        type: 'portion',
        sizes: [
            { label: 'Half', price: 300 },
            { label: 'Full', price: 480 }
        ],
        pairingId: 'b4', // Ghee Rice
        macros: { calories: 550, protein: '30g', carbs: '18g' }
    },
    {
        id: 'm5',
        name: 'Spicy Beef Fry',
        description: 'Tender beef cubes stir-fried with coconut slivers, pepper, and fennel.',
        price: 480,
        category: 'Mains',
        image: 'https://images.unsplash.com/photo-1626509673367-1605553049b6?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'fiery',
        heroIngredient: 'red_meat',
        allergens: [],
        tags: ['high_protein', 'paleo', 'keto', 'spicy'],
        prepTime: 20,
        calories: 550,
        stock: 10,
        rating: 4.7,
        dietaryType: 'non-veg',
        isAvailable: true,
        type: 'portion',
        sizes: [
            { label: 'Half', price: 280 },
            { label: 'Full', price: 480 }
        ],
        pairingId: 'b1', // Parotta
        macros: { calories: 550, protein: '40g', carbs: '10g' }
    },
    {
        id: 'm6',
        name: 'Paneer Butter Masala',
        description: 'Soft paneer cubes in a rich, creamy tomato and cashew gravy.',
        price: 380,
        category: 'Mains',
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'medium',
        heroIngredient: 'veg',
        allergens: ['dairy', 'treenuts'],
        tags: ['vegetarian', 'comfort'],
        prepTime: 20,
        calories: 450,
        stock: 2,
        rating: 4.5,
        dietaryType: 'veg',
        isAvailable: true,
        type: 'portion',
        sizes: [
            { label: 'Half', price: 240 },
            { label: 'Full', price: 380 }
        ],
        pairingId: 'b1',
        macros: { calories: 450, protein: '18g', carbs: '25g' }
    },
    {
        id: 'm7',
        name: 'Egg Roast',
        description: 'Boiled eggs in a thick, spicy onion-tomato gravy.',
        price: 280,
        category: 'Mains',
        image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'medium',
        heroIngredient: 'poultry',
        allergens: ['egg'],
        tags: ['protein', 'balanced', 'sugar_conscious'],
        prepTime: 15,
        calories: 220,
        stock: 14,
        rating: 4.3,
        dietaryType: 'non-veg', // Egg is non-veg in this context (red dot)
        isAvailable: true,
        type: 'unit',
        pairingId: 'b2',
        macros: { calories: 220, protein: '14g', carbs: '12g' }
    },

    // BREADS / RICE
    {
        id: 'b1',
        name: 'Kerala Parotta',
        description: 'Flaky, layered flatbread made with refined flour.',
        price: 40,
        category: 'Breads/Rice',
        image: 'https://images.unsplash.com/photo-1625475172084-5f532a2f8c05?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'mild',
        heroIngredient: 'rice', // Grouping wheat under broad staple
        allergens: ['gluten'],
        tags: ['comfort'],
        prepTime: 10,
        calories: 300,
        stock: 100,
        rating: 4.9,
        dietaryType: 'veg',
        isAvailable: true,
        type: 'unit',
        pairingId: 'm5', // Beef Fry
        macros: { calories: 300, protein: '6g', carbs: '45g' }
    },
    {
        id: 'b2',
        name: 'Appam',
        description: 'Soft, lacey pancakes made from fermented rice batter and coconut milk.',
        price: 35,
        category: 'Breads/Rice',
        image: 'https://images.unsplash.com/photo-1616052745339-a91523f2f84b?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'mild',
        heroIngredient: 'rice',
        allergens: [],
        tags: ['vegan', 'gut_friendly', 'light'],
        prepTime: 10,
        calories: 120,
        stock: 50,
        rating: 4.6,
        dietaryType: 'veg',
        isAvailable: true,
        type: 'unit',
        pairingId: 'm3', // Stew
        macros: { calories: 120, protein: '2g', carbs: '28g' }
    },
    {
        id: 'b3',
        name: 'Chicken Biryani',
        description: 'Aromatic basmati rice cooked with spiced chicken and herbs.',
        price: 380,
        category: 'Breads/Rice',
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'medium',
        heroIngredient: 'poultry',
        allergens: ['dairy'],
        tags: ['comfort', 'high_protein'],
        prepTime: 25,
        calories: 650,
        stock: 0,
        rating: 4.8,
        dietaryType: 'non-veg',
        available: false, // SOLD OUT TEST
        type: 'portion',
        sizes: [
            { label: 'Half', price: 240 },
            { label: 'Full', price: 380 }
        ],
        addons: [
            { name: 'Extra Raitha', price: 20 },
            { name: 'Fried Onion', price: 15 },
            { name: 'Extra Pappadam', price: 10 }
        ],
        pairingId: 'be1', // Lime Soda
        macros: { calories: 650, protein: '35g', carbs: '70g' }
    },
    {
        id: 'b4',
        name: 'Ghee Rice (Neychoru)',
        description: 'Fragrant short-grain rice cooked with ghee, spices, raisins and cashews.',
        price: 220,
        category: 'Breads/Rice',
        image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'mild',
        heroIngredient: 'rice',
        allergens: ['dairy', 'treenuts'],
        tags: ['comfort', 'kids_friendly'],
        prepTime: 15,
        calories: 380,
        stock: 20,
        rating: 4.5,
        dietaryType: 'veg',
        isAvailable: true,
        type: 'portion',
        sizes: [
            { label: 'Half', price: 140 },
            { label: 'Full', price: 220 }
        ],
        pairingId: 'm1', // Chicken Roast
        macros: { calories: 380, protein: '6g', carbs: '60g' }
    },

    // DESSERTS & BEVERAGES
    {
        id: 'd1',
        name: 'Palada Payasam',
        description: 'Sweet rice pasta slow-cooked in milk and sugar, garnished with cardamom.',
        price: 180,
        category: 'Dessert',
        image: 'https://images.unsplash.com/photo-1628169604754-583b6329007f?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'mild',
        heroIngredient: 'rice',
        allergens: ['dairy', 'gluten'],
        tags: ['comfort', 'sweet'],
        prepTime: 5,
        calories: 450,
        stock: 15,
        rating: 4.9,
        dietaryType: 'veg',
        isAvailable: true,
        type: 'portion',
        sizes: [
            { label: 'Cup', price: 100 },
            { label: 'Bowl', price: 180 }
        ],
        macros: { calories: 450, protein: '8g', carbs: '65g' }
    },
    {
        id: 'd2',
        name: 'Tender Coconut Pudding',
        description: 'Light and creamy pudding made with fresh tender coconut water and meat.',
        price: 200,
        category: 'Dessert',
        image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'mild',
        heroIngredient: 'veg',
        allergens: ['dairy'],
        tags: ['cool', 'sweet'],
        prepTime: 0,
        calories: 220,
        stock: 8,
        rating: 4.7,
        dietaryType: 'veg',
        isAvailable: true,
        type: 'unit',
        macros: { calories: 220, protein: '4g', carbs: '25g' }
    },
    {
        id: 'be1',
        name: 'Fresh Lime Soda',
        description: 'Refreshing lime juice with soda, served sweet or salted.',
        price: 80,
        category: 'Beverages',
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop',
        spiceLevel: 'mild',
        heroIngredient: 'veg',
        allergens: [],
        tags: ['cool', 'vegan', 'sugar_conscious'],
        prepTime: 5,
        calories: 120,
        stock: 100,
        rating: 4.5,
        dietaryType: 'veg',
        isAvailable: true,
        type: 'unit',
        addons: [
            { name: 'Add Mint', price: 10 },
            { name: 'Add Ginger', price: 10 }
        ],
        macros: { calories: 120, protein: '0g', carbs: '30g' }
    }
];
