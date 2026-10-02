import fs from 'fs';
import path from 'path';

export interface LocalRecipe {
    id: string;
    title: string;
    category: 'frosting' | 'structure' | 'allergen_substitute';
    allergensCleared: string[];
    notes: string;
}

const DB_PATH = path.join(process.cwd(), 'local_recipes.json');

// Initialize embedded JSON file if missing
if (!fs.existsSync(DB_PATH)) {
    const initialData: LocalRecipe[] = [
        {
            id: 'rec_1',
            title: 'Swiss Meringue Buttercream Base',
            category: 'frosting',
            allergensCleared: ['gluten', 'nuts'],
            notes: 'Ratio: 1 part egg whites, 2 parts sugar, 3 parts butter by weight.'
        },
        {
            id: 'rec_2',
            title: 'Vegan Buttercream Alternative',
            category: 'allergen_substitute',
            allergensCleared: ['dairy', 'gluten', 'nuts'],
            notes: 'Swap butter for 1:1 high-fat vegetable shortening with 1 tsp vanilla extract.'
        }
    ];
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
}

export function searchLocalRecipes(query: string): LocalRecipe[] {
    const recipes: LocalRecipe[] = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const lowerQuery = query.toLowerCase();

    return recipes.filter(r =>
        r.title.toLowerCase().includes(lowerQuery) ||
        r.notes.toLowerCase().includes(lowerQuery) ||
        r.allergensCleared.some(a => lowerQuery.includes(a))
    );
}