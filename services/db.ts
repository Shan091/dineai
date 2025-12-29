// Shared Types
export type DietaryType = 'veg' | 'non-veg' | 'egg';
export type SpiceLevel = 'mild' | 'medium' | 'fiery';

export interface UserPreferences {
  dietary: DietaryType;
  allergens: string[];
  spiceLevel: SpiceLevel;
  cravings: string[];
  // New "Total Profile" fields
  healthGoals: string[];
  diningContext: string[];
}

export interface UserProfile {
  phoneNumber: string;
  preferences?: UserPreferences;
  lastLogin: string;
  createdAt: string;
}

const DB_KEY = 'dineai_users_db';

// Simulate network delay to feel like a real database connection
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const db = {
  // GET User by Phone
  async getUser(phoneNumber: string): Promise<UserProfile | null> {
    await delay(800); // Network latency
    try {
      const data = localStorage.getItem(DB_KEY);
      const users: Record<string, UserProfile> = data ? JSON.parse(data) : {};
      return users[phoneNumber] || null;
    } catch (e) {
      console.error("DB Read Error", e);
      return null;
    }
  },

  // CREATE New User
  async createUser(phoneNumber: string): Promise<UserProfile> {
    await delay(600); // Network latency
    
    const data = localStorage.getItem(DB_KEY);
    const users: Record<string, UserProfile> = data ? JSON.parse(data) : {};
    
    // Return existing if race condition
    if (users[phoneNumber]) return users[phoneNumber];

    const newUser: UserProfile = {
      phoneNumber,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    users[phoneNumber] = newUser;
    localStorage.setItem(DB_KEY, JSON.stringify(users));
    
    return newUser;
  },

  // UPDATE User Preferences
  async savePreferences(phoneNumber: string, preferences: UserPreferences): Promise<UserProfile> {
    await delay(1500); // Simulate heavy processing/curation
    
    const data = localStorage.getItem(DB_KEY);
    const users: Record<string, UserProfile> = data ? JSON.parse(data) : {};
    
    if (!users[phoneNumber]) {
      // Auto-create if missing
      users[phoneNumber] = {
        phoneNumber,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
    }

    users[phoneNumber] = {
      ...users[phoneNumber],
      preferences,
      lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem(DB_KEY, JSON.stringify(users));
    return users[phoneNumber];
  }
};