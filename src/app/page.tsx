"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, Sparkles, Settings2, CakeSlice } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content: "CrumbCraft ready! What are we baking today? 🎂",
    },
  ]);
  const hasSpoken = useRef(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chatArea = chatAreaRef.current;
    if (chatArea) {
      chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isThinking]);

  useEffect(() => {
    if (!hasSpoken.current) {
      hasSpoken.current = true;
      fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "CrumbCraft ready! What are we baking today?" })
      }).catch(console.error);
    }
  }, []);

  const toggleRecording = async () => {
    if (isRecording || isThinking) return;

    setIsRecording(true);

    let recordingTimer: ReturnType<typeof setTimeout> | undefined;

    try {
      recordingTimer = setTimeout(() => {
        setIsRecording(false);
        setIsThinking(true);
      }, 6_000);

      const response = await fetch('/api/chat', { method: 'POST' });
      clearTimeout(recordingTimer);
      setIsRecording(false);
      setIsThinking(true);

      const data = await response.json();
      setIsThinking(false);

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "u", role: "user", content: data.userText },
          { id: Date.now().toString() + "a", role: "assistant", content: data.agentText },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: `Oops! ${data.error}` },
        ]);
      }
    } catch (err) {
      if (recordingTimer) clearTimeout(recordingTimer);
      setIsRecording(false);
      setIsThinking(false);
      console.error(err);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden selection:bg-orange-500/40">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-gradient-to-br from-orange-600/20 to-rose-600/10 blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[70%] rounded-full bg-gradient-to-tl from-amber-500/15 to-yellow-500/5 blur-[160px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 border-b border-white/[0.04] bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20 border border-white/10 relative overflow-hidden">
            <CakeSlice className="w-5 h-5 text-white z-10" />
            <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-orange-100 to-orange-400 bg-clip-text text-transparent">
              CrumbCraft
            </h1>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-white/50 font-medium tracking-wide uppercase">Offline Model Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white transition-all border border-white/5">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Chat Area */}
      <div className="relative z-10 flex-1 w-full max-w-3xl mx-auto flex flex-col pt-8 pb-32 px-4 sm:px-6">
        <div ref={chatAreaRef} className="flex-1 overflow-y-auto space-y-8 scrollbar-hide pb-10">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

                  {/* Avatar */}
                  {msg.role === "assistant" && (
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-1 shadow-inner shadow-white/5">
                      <Sparkles className="w-5 h-5 text-orange-400" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`px-6 py-4 rounded-3xl text-[15px] leading-relaxed backdrop-blur-md border ${msg.role === "user"
                        ? "bg-gradient-to-br from-orange-500 to-rose-500 text-white border-orange-400/30 rounded-tr-sm shadow-lg shadow-orange-500/10"
                        : "bg-white/[0.03] text-white/90 border-white/[0.08] rounded-tl-sm shadow-xl"
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}

            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-1 shadow-inner shadow-white/5">
                  <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                </div>
                <div className="px-6 py-4 rounded-3xl bg-white/[0.03] border border-white/[0.08] rounded-tl-sm flex flex-col gap-3 backdrop-blur-md">
                  <div className="flex gap-2 items-center h-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-orange-400/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-orange-400/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <LoadingText />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative flex items-center justify-center group"
        >
          {/* Animated Glow behind button */}
          {isRecording && (
            <motion.div
              className="absolute -inset-6 rounded-full bg-rose-500/20 blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          <button
            onClick={toggleRecording}
            disabled={isThinking}
            className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-500 border-[3px] shadow-2xl ${isRecording
                ? "bg-rose-500 hover:bg-rose-600 border-rose-400 shadow-rose-500/30 scale-110"
                : isThinking
                  ? "bg-[#111] border-white/10 text-white/30 cursor-not-allowed"
                  : "bg-white hover:bg-orange-50 border-white shadow-white/10 hover:scale-105"
              }`}
          >
            {isThinking ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : isRecording ? (
              <Square className="w-10 h-10 text-white fill-current" />
            ) : (
              <Mic className="w-10 h-10 text-orange-500 fill-current" />
            )}
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-[13px] font-medium tracking-wide mt-6 text-white/40 uppercase"
        >
          {isRecording ? "Listening on Server Microphone..." : isThinking ? "Processing Audio..." : "Tap to speak to CrumbCraft"}
        </motion.p>
      </div>

    </main>
  );
}

function LoadingText() {
  const [index, setIndex] = useState(0);
  const phrases = [
    "Transcribing audio...",
    "Warming up the oven...",
    "Measuring ingredients...",
    "Checking allergies...",
    "Baking a response...",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [phrases.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.3 }}
        className="text-xs text-orange-400/80 font-medium italic tracking-wide"
      >
        {phrases[index]}
      </motion.span>
    </AnimatePresence>
  );
}
