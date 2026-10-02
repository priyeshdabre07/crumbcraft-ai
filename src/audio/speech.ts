import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function speakText(text: string): Promise<void> {
    try {
        const safeText = text.replace(/"/g, '\\"');
        console.log(`\n🔊 [Offline Speech Output]: "${text}"`);

        // Speaks response out loud via native macOS speech engine
        await execAsync(`say -v Samantha "${safeText}"`);
    } catch (err) {
        console.error('Offline speech output error:', err);
    }
}