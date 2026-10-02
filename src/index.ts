import { crumbCraftAgent } from './agent';
import { speakText } from './audio/speech';

async function runKitchenSimulation() {
    console.log('🤖 CrumbCraft AI Active | Running 100% Offline Mode...\n');

    // Test Case 1: Multi-tiered frosting calculation
    const prompt1 = "Niki here. I am making an 8-inch and 10-inch cake with Swiss Meringue Buttercream. How much frosting do I need?";
    console.log(`👤 Niki: "${prompt1}"`);

    const response1 = await crumbCraftAgent.generate(prompt1);
    console.log(`🤖 CrumbCraft: ${response1.text}`);
    await speakText(response1.text);

    console.log('\n----------------------------------------\n');

    // Test Case 2: Allergen substitution safety check
    const prompt2 = "The client has a severe dairy allergy. Can I use regular butter in my piping frosting?";
    console.log(`👤 Niki: "${prompt2}"`);

    const response2 = await crumbCraftAgent.generate(prompt2);
    console.log(`🤖 CrumbCraft: ${response2.text}`);
    await speakText(response2.text);
}

runKitchenSimulation().catch(console.error);