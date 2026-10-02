import { Agent } from '@mastra/core/agent';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { allergenCheckerTool, frostingScalerTool } from './tools/bakingTools';
import { crumbCraftInstructions } from './crumbcraft-instructions';

// Point directly to local Ollama running on your Mac
const ollamaGemma = createOpenAICompatible({
    name: 'ollama',
    baseURL: 'http://localhost:11434/v1',
});


export const crumbCraftAgent = new Agent({
    id: 'crumb-craft-agent',
    name: 'CrumbCraft Assistant',
    instructions: crumbCraftInstructions,
    model: ollamaGemma('gemma4:e4b'),
    tools: {
        allergenChecker: allergenCheckerTool,
        frostingScaler: frostingScalerTool,
    },
});