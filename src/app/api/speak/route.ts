import { NextResponse } from 'next/server';
import { speakText } from '../../../audio/speech';

export async function POST(req: Request) {
    try {
        const { text } = await req.json();
        if (text) {
            await speakText(text);
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
