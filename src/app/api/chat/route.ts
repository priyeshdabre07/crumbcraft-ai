import { NextResponse } from 'next/server';
import { recordAudio, transcribeAudio } from '../../../audio/listen';
import { crumbCraftAgent } from '../../../agent';
import { speakText } from '../../../audio/speech';

/**
 * Detects Whisper hallucinations and blank audio artifacts.
 * Extracted from voiceLoop.ts
 */
function isHallucination(text: string): boolean {
    const hallucinationPatterns = [
        /^\[BLANK_AUDIO\]$/i,
        /\[BLANK_AUDIO\]/i,
        /^\s*\(.*\)\s*\.?\s*$/,
        /^\s*\[.*\]\s*\.?\s*$/,
        /thank you(\.)?\s*$/i,
        /^\s*\.+\s*$/,
        /^[^a-zA-Z]*$/,
    ];
    return hallucinationPatterns.some(p => p.test(text.trim()));
}

export async function POST(req: Request) {
    try {
        console.log('API triggered: Starting recording...');

        // 1. Record live audio from server microphone
        const audioFilePath = await recordAudio(6);

        // 2. Transcribe locally with Whisper
        const userSpeech = await transcribeAudio(audioFilePath);

        if (!userSpeech || userSpeech.length < 3 || isHallucination(userSpeech)) {
            console.log('⚠️ No clear speech detected.');
            return NextResponse.json({
                success: false,
                error: 'No clear speech detected. Please try again.'
            }, { status: 400 });
        }

        console.log(`\n👤 You said: "${userSpeech}"`);

        // 3. Process with local Gemma 4 Mastra Agent
        console.log('🧠 Thinking locally via Gemma 4...');
        const response = await crumbCraftAgent.generate(userSpeech);

        console.log(`🤖 CrumbCraft: ${response.text}`);

        // 4. Speak response back via macOS Speech Engine
        speakText(response.text).catch(console.error);

        return NextResponse.json({
            success: true,
            userText: userSpeech,
            agentText: response.text
        });

    } catch (error: any) {
        console.error('Error in chat API:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'An error occurred'
        }, { status: 500 });
    }
}
