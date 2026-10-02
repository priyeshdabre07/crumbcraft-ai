# CrumbCraft AI

CrumbCraft is a voice-first baking and cake-decorating assistant. It answers spoken questions about recipes and decorating, checks some common allergen substitutions, and estimates frosting quantities for multi-tier cakes.

The chat interface is a Next.js app. Speech recognition and speech output run on the macOS machine hosting the app, and the assistant uses a local Ollama model.

## Requirements

- macOS, for CoreAudio microphone capture and the built-in `say` speech command
- Node.js and npm
- [Ollama](https://ollama.com/) with the model used by the app:

  ```bash
  ollama pull gemma4:e4b
  ```

- SoX, for microphone recording and audio normalization:

  ```bash
  brew install sox
  ```

The `whisper-node` dependency provides the Whisper executable and English base model used for local transcription.

## Run locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Make sure Ollama is running and has `gemma4:e4b` available before speaking to CrumbCraft.

Other available scripts:

```bash
npm run build
npm start
```

`npm start` serves the production build, so run `npm run build` first.

## Using voice chat

Tap the microphone button in the app. The server records approximately six seconds from its default microphone, transcribes the recording locally with Whisper, sends the transcript to the local Ollama model, and speaks the response through the Mac's `say` command.

Because the microphone and speakers belong to the server process, run the app on the Mac whose microphone and speakers you want to use. The terminal or IDE running the server must have microphone permission in **System Settings → Privacy & Security → Microphone**. If permission was just granted, fully quit and reopen that app.

### Optional audio configuration

The app reads these optional environment variables:

- `MIC_DEVICE`: CoreAudio input device name. Defaults to `default`.
- `WHISPER_DIR`: path to the Whisper directory containing `main` and `models/ggml-base.en.bin`. Defaults to the installed `whisper-node` package directory.

Set them in the same shell before starting the server, for example:

```bash
export MIC_DEVICE="MacBook Pro Microphone"
npm run dev
```

## Baking tools and data

- The allergen checker currently handles simple dairy and gluten ingredient matches and may suggest substitutions from local recipe data. It is a basic helper, not a guarantee that a food or product is allergen-safe; verify ingredient labels and cross-contamination information.
- The frosting scaler estimates quantities from the cake tier diameters.
- `local_recipes.json` contains the local recipe and substitution entries. If the file is missing, the local database module creates it with starter data.

## Project structure

- `src/app/` — Next.js interface and API routes
- `src/agent.ts` and `src/crumbcraft-instructions.ts` — assistant model setup and behavior
- `src/tools/` — baking and allergen tools
- `src/audio/` — local microphone capture, transcription, and speech output
- `src/db/` and `local_recipes.json` — local recipe data

The project does not currently have an automated test suite configured.
