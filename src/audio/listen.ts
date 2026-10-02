import { execFile } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import path from 'path';
import fs from 'fs';

const execFileAsync = promisify(execFile);

// Recordings live in the temp folder so they never depend on process.cwd().
// They are overwritten on each run, so after a bad transcription you can re-run
// whisper.cpp on the exact file that failed (see README note in the chat).
const RECORDING_PATH = path.join(os.tmpdir(), 'whisper-input.wav');
const NORMALIZED_PATH = path.join(os.tmpdir(), 'whisper-input-norm.wav');

// We call whisper.cpp's `main` binary directly instead of going through whisper-node.
// Override with WHISPER_DIR if your install lives somewhere else.
const WHISPER_DIR =
    process.env.WHISPER_DIR ??
    path.join(process.cwd(), 'node_modules', 'whisper-node', 'lib', 'whisper.cpp');
const MODEL_NAME = 'base.en';

// IDE/GUI-launched terminals often have a minimal PATH, so check Homebrew locations explicitly.
const SOX_CANDIDATES = ['/opt/homebrew/bin/sox', '/usr/local/bin/sox'];

// Peak amplitude (0.0 - 1.0) below which a recording is treated as silent.
const SILENCE_THRESHOLD = 0.01;

function findSox(): string {
    const found = SOX_CANDIDATES.find((p) => fs.existsSync(p));
    if (!found) {
        throw new Error('SoX not found. Install it with: brew install sox');
    }
    return found;
}

/** Returns the loudest sample in the file (0.0 = pure silence, 1.0 = full scale). */
async function getPeakAmplitude(sox: string, file: string): Promise<number> {
    // `sox <file> -n stat` prints its statistics to stderr.
    const { stderr } = await execFileAsync(sox, [file, '-n', 'stat']);
    const match = stderr.match(/Maximum amplitude:\s+([0-9.]+)/);
    return match ? parseFloat(match[1]) : NaN;
}

/**
 * Records audio from the microphone with SoX.
 * Set MIC_DEVICE to a specific input name (e.g. "MacBook Pro Microphone") to avoid
 * the system "default" device, which may be a Bluetooth headset or virtual device.
 */
export async function recordAudio(durationSeconds: number = 5): Promise<string> {
    const sox = findSox();
    const device = process.env.MIC_DEVICE ?? 'default';

    console.log(`\n🎙️ [Listening...] Speak now! (${durationSeconds}s, device: ${device})`);

    if (fs.existsSync(RECORDING_PATH)) {
        fs.unlinkSync(RECORDING_PATH);
    }

    // Output options (16 kHz, mono, 16-bit) go before the output file; SoX converts automatically.
    const args = [
        '-q',
        '-t', 'coreaudio', device,
        '-r', '16000',
        '-c', '1',
        '-b', '16',
        '-e', 'signed-integer',
        RECORDING_PATH,
        'trim', '0', String(durationSeconds),
    ];

    try {
        // The timeout stops a stuck mic-permission prompt from hanging forever.
        await execFileAsync(sox, args, { timeout: (durationSeconds + 10) * 1000 });
    } catch (err) {
        console.error(
            'Error capturing microphone input. Check that SoX is installed and that the app running this ' +
            '(Terminal / iTerm / VS Code / Cursor) has Microphone permission:',
            err
        );
        throw err;
    }

    const size = fs.existsSync(RECORDING_PATH) ? fs.statSync(RECORDING_PATH).size : 0;
    if (size < 1000) {
        throw new Error(`Recording is empty (${size} bytes). SoX could not read from the input device.`);
    }

    // A silent 5 s file is still ~160 KB, so a size check alone cannot catch silence.
    const peak = await getPeakAmplitude(sox, RECORDING_PATH);
    console.log(`   saved ${size} bytes, peak amplitude: ${peak}`);

    if (!(peak > SILENCE_THRESHOLD)) {
        console.warn(
            '⚠️  The recording is silent. Most likely causes:\n' +
            '   1. The app running this has no Microphone permission\n' +
            '      (System Settings > Privacy & Security > Microphone, then fully quit and reopen it).\n' +
            '   2. SoX is using the wrong input device. Set MIC_DEVICE to your mic name.'
        );
    }

    // Quiet mics can make Whisper return [BLANK_AUDIO]. Normalize to a -3 dBFS peak, but only after
    // the silence check above, since normalizing would turn a silent recording into loud noise.
    let outputPath = RECORDING_PATH;
    if (peak > SILENCE_THRESHOLD) {
        await execFileAsync(sox, ['-q', RECORDING_PATH, NORMALIZED_PATH, 'gain', '-n', '-3']);
        outputPath = NORMALIZED_PATH;
    }

    console.log('🛑 [Recording finished] Transcribing locally...');
    return outputPath;
}

/** Removes Whisper's non-speech markers and tidies whitespace. */
function cleanTranscript(raw: string): string {
    return raw
        .replace(/\[[A-Z_ ]+\]/g, '')                // e.g. [BLANK_AUDIO]
        .replace(/\((silence|music|noise)\)/gi, '')  // e.g. (silence)
        .replace(/\s+/g, ' ')
        .replace(/\(.*?\)/gi, '')
        .trim();
}

/** Transcribes a 16 kHz mono WAV file by running whisper.cpp's `main` binary directly. */
export async function transcribeAudio(audioPath: string): Promise<string> {
    const binary = path.join(WHISPER_DIR, 'main');
    const model = path.join(WHISPER_DIR, 'models', `ggml-${MODEL_NAME}.bin`);

    for (const file of [binary, model, audioPath]) {
        if (!fs.existsSync(file)) {
            console.error('Missing file, cannot transcribe:', file);
            return '';
        }
    }

    const { size } = fs.statSync(audioPath);
    if (size < 1000) {
        console.error('Audio file is empty or corrupted. Size:', size, 'bytes');
        return '';
    }

    try {
        // -nt = plain text with no timestamps. Model-loading logs go to stderr, results to stdout.
        const { stdout } = await execFileAsync(
            binary,
            ['-m', model, '-f', audioPath, '-nt', '-l', 'en'],
            { cwd: WHISPER_DIR, timeout: 60_000, maxBuffer: 10 * 1024 * 1024 }
        );

        console.log('   [whisper raw output]', JSON.stringify(stdout.trim()));
        return cleanTranscript(stdout);
    } catch (err) {
        console.error('Local transcription error:', err);
        return '';
    }
}