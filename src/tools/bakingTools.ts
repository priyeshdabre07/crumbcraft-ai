import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { searchLocalRecipes } from '../db/localDb';

export const allergenCheckerTool = createTool({
    id: 'allergen-checker',
    description: 'Checks if an ingredient or substitution is safe for a given allergy list.',
    inputSchema: z.object({
        ingredient: z.string().describe('Ingredient being checked'),
        allergies: z.array(z.string()).describe('List of client allergies (e.g., gluten, dairy, nuts)'),
    }),
    outputSchema: z.object({
        safe: z.boolean(),
        warning: z.string(),
        recommendedSubstitute: z.string().optional(),
    }),
    execute: async ({ ingredient, allergies }) => {
        const lowerIng = ingredient.toLowerCase();

        let safe = true;
        let warning = 'Safe to use.';
        let recommendedSubstitute = undefined;

        const allergenList = allergies.map(a => a.toLowerCase());

        if (allergenList.includes('dairy') && (lowerIng.includes('butter') || lowerIng.includes('milk'))) {
            safe = false;
            warning = 'Dairy conflict detected!';

            const localMatches = searchLocalRecipes('vegan');
            recommendedSubstitute = localMatches.length > 0
                ? localMatches[0].notes
                : 'Plant-based vegetable shortening or high-fat vegan butter alternative.';
        } else if (allergenList.includes('gluten') && lowerIng.includes('flour')) {
            safe = false;
            warning = 'Gluten conflict detected!';
            recommendedSubstitute = '1:1 Gluten-Free Baking Flour Blend (with Xanthan Gum).';
        }

        return { safe, warning, recommendedSubstitute };
    },
});

export const frostingScalerTool = createTool({
    id: 'frosting-scaler',
    description: 'Calculates total frosting volume and key ingredient weights based on cake tier diameters.',
    inputSchema: z.object({
        tierSizesInInches: z.array(z.number()).describe('Array of tier diameters in inches, e.g. [6, 8, 10]'),
        frostingType: z.string().describe('Type of frosting, e.g., Swiss Meringue Buttercream'),
    }),
    outputSchema: z.object({
        totalCupsNeeded: z.number(),
        butterGrams: z.number(),
        sugarGrams: z.number(),
    }),
    execute: async ({ tierSizesInInches }) => {
        const totalSurfaceArea = tierSizesInInches.reduce((acc, d) => acc + Math.PI * Math.pow(d / 2, 2), 0);
        const totalCupsNeeded = Math.round((totalSurfaceArea * 0.15) * 10) / 10;

        return {
            totalCupsNeeded,
            butterGrams: Math.round(totalCupsNeeded * 115),
            sugarGrams: Math.round(totalCupsNeeded * 120),
        };
    },
});