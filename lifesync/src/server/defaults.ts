import type { StockUnit } from "@prisma/client";

/** Default grocery products (editable/removable by users). Minimum stock starts at 0:
 *  the app does not assume consumption – members set their own thresholds. */
export const DEFAULT_GROCERY_PRODUCTS: { name: string; category: string; unit: StockUnit }[] = [
  { name: "Rice", category: "Grains", unit: "KG" },
  { name: "Egg", category: "Dairy & Eggs", unit: "PIECE" },
  { name: "Oil", category: "Cooking", unit: "LITRE" },
  { name: "Onion", category: "Vegetables", unit: "KG" },
  { name: "Potato", category: "Vegetables", unit: "KG" },
  { name: "Chicken", category: "Meat & Fish", unit: "KG" },
  { name: "Fish", category: "Meat & Fish", unit: "KG" },
  { name: "Meat", category: "Meat & Fish", unit: "KG" },
  { name: "Vegetables", category: "Vegetables", unit: "KG" },
  { name: "Milk", category: "Dairy & Eggs", unit: "LITRE" },
  { name: "Bread", category: "Bakery", unit: "PACKET" },
  { name: "Sugar", category: "Pantry", unit: "KG" },
  { name: "Tea", category: "Drinks", unit: "PACKET" },
  { name: "Biscuits", category: "Snacks", unit: "PACKET" },
  { name: "Salt", category: "Pantry", unit: "PACKET" },
  { name: "Spices", category: "Pantry", unit: "PACKET" },
  { name: "Garlic", category: "Vegetables", unit: "GRAM" },
  { name: "Ginger", category: "Vegetables", unit: "GRAM" },
  { name: "Lentils", category: "Grains", unit: "KG" },
  { name: "Chickpeas", category: "Grains", unit: "KG" },
  { name: "Pasta", category: "Grains", unit: "PACKET" },
  { name: "Other", category: "General", unit: "PIECE" },
];

/** Pasta and Filishake are configurable categories; their meaning is left to the users. */
export const SYSTEM_ACTIVITY_CATEGORIES = [
  { key: "PASTA", name: "Pasta", color: "#F59E0B", icon: "utensils" },
  { key: "FILISHAKE", name: "Filishake", color: "#8B5CF6", icon: "cup-soda" },
];

export const INVITATION_TTL_HOURS = 72;
