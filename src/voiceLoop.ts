import { recordAudio, transcribeAudio } from './audio/listen';
import { crumbCraftAgent } from './agent';
import { speakText } from './audio/speech';

/**
 * Detects Whisper hallucinations and blank audio artifacts.
 * Whisper commonly outputs these when it receives silence or background noise.
 */
function isHallucination(text: string): boolean {
    const hallucinationPatterns = [
        /^\[BLANK_AUDIO\]$/i,          // Pure blank audio marker
        /\[BLANK_AUDIO\]/i,            // Blank audio mixed with other text
        /^\s*\(.*\)\s*\.?\s*$/,        // Pure sound annotations like (whistling), (music)
        /^\s*\[.*\]\s*\.?\s*$/,        // Pure bracket markers like [Music], [Applause]
        /thank you(\.)?\s*$/i,         // Common Whisper hallucination on silence
        /^\s*\.+\s*$/,                 // Just dots
        /^[^a-zA-Z]*$/,                // No actual letters at all
    ];
    return hallucinationPatterns.some(p => p.test(text.trim()));
}

async function startVoiceInteractionLoop() {
    console.log('====================================================');
    console.log('🤖 CrumbCraft AI: Offline Hands-Free Voice Agent Active');
    console.log('====================================================\n');

    await speakText("CrumbCraft ready. What are we baking today?");

    while (true) {
        try {
            // 1. Record live audio from microphone (5-second window)
            const audioFilePath = await recordAudio(6);
            console.log(audioFilePath)
            // 2. Transcribe locally with Whisper
            const userSpeech = await transcribeAudio(audioFilePath);

            if (!userSpeech || userSpeech.length < 3 || isHallucination(userSpeech)) {
                console.log('⚠️ No clear speech detected. Listening again...');
                continue;
            }

            console.log(`\n👤 You said: "${userSpeech}"`);

            // Exit word trigger
            if (userSpeech.toLowerCase().includes('goodbye') || userSpeech.toLowerCase().includes('stop')) {
                await speakText("Happy baking! Closing CrumbCraft assistant.");
                console.log('👋 Session ended.');
                break;
            }

            // 3. Process with local Gemma 4 Mastra Agent
            console.log('🧠 Thinking locally via Gemma 4...');
            const response = await crumbCraftAgent.generate(userSpeech);

            console.log(`🤖 CrumbCraft: ${response.text}`);

            // 4. Speak response back via macOS Speech Engine
            await speakText(response.text);

            console.log('\n----------------------------------------------------\n');
        } catch (err) {
            console.error('Error in voice interaction loop:', err);
            break;
        }
    }
}

startVoiceInteractionLoop();