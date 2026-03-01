import React from "react";
import { useAudioStream } from "../../hooks/useAudioStream";
import {
  Mic,
  Square,
  CheckCircle2,
  Activity,
  Terminal,
  Shield,
  Zap,
} from "lucide-react";

export const Meeting: React.FC = () => {
  const { isRecording, transcript, insights, startRecording, stopRecording } =
    useAudioStream();

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 font-sans antialiased selection:bg-red-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER SECTION: MATCHING NEURAL INTERFACE STYLE */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-5">
            {/* Red Diamond Icon Accent */}
            <div className="h-12 w-12 bg-red-600 flex items-center justify-center rotate-45 border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              <Zap size={22} className="-rotate-45 text-white fill-current" />
            </div>

            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">
                Meeting{" "}
                <span className="text-zinc-500 font-light tracking-normal">
                  Analyzer
                </span>
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                <span className="flex items-center gap-1.5">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-zinc-700"}`}
                  />
                  {isRecording ? "Session Active" : "System Ready"}
                </span>
                <span className="text-zinc-800">|</span>
                <span>Real-time transcription and insights</span>
              </div>
            </div>
          </div>

          {/* Angular Action Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`relative flex items-center gap-3 px-8 py-3 font-black uppercase tracking-widest transition-all duration-300 ${
              isRecording
                ? "bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                : "bg-red-600 text-white hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.2)]"
            }`}
            style={{ clipPath: "polygon(12% 0, 100% 0, 88% 100%, 0% 100%)" }}
          >
            <div className="flex items-center gap-2">
              {isRecording ? (
                <Square size={18} fill="currentColor" />
              ) : (
                <Mic size={18} />
              )}
              <span>
                {isRecording ? "End Session" : "Start Meeting Analysis"}
              </span>
            </div>
          </button>
        </div>

        {/* MAIN INTERFACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LIVE TRANSCRIPT PANEL */}
          <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-sm relative overflow-hidden shadow-2xl">
            {/* Left-edge Red Indicator */}
            <div className="absolute top-0 left-0 w-0.5 h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" />

            <div className="p-6 flex flex-col h-162.5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity
                    size={14}
                    className={
                      isRecording
                        ? "animate-pulse text-red-500"
                        : "text-zinc-600"
                    }
                  />
                  Live Transcript
                </h2>
                <div className="font-mono text-[9px] text-zinc-600 uppercase"></div>
              </div>

              <div className="flex-1 overflow-y-auto pr-3 space-y-4 font-mono">
                {transcript ? (
                  <p className="text-base text-zinc-300 leading-relaxed">
                    <span className="text-red-600 opacity-50 mr-2 font-black italic">
                      ≫
                    </span>
                    {transcript}
                  </p>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
                    <Terminal size={64} strokeWidth={1} />
                    <p className="uppercase text-[10px] tracking-[0.4em] font-black text-white text-center">
                      Awaiting audio input to begin transcription...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* INSIGHTS SIDEBAR */}
          <div className="lg:col-span-4 space-y-5">
            {/* EXECUTIVE SUMMARY PANEL */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm shadow-xl relative overflow-hidden">
              <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 border-l-2 border-red-600 pl-3">
                Executive Summary
              </h2>
              <div className="p-4 bg-zinc-950/50 border border-zinc-800">
                <p className="text-sm text-zinc-400 leading-relaxed italic font-light">
                  <span className="text-red-600 mr-2 font-bold font-mono">
                    »
                  </span>
                  {insights?.summary ||
                    "The AI agent will provide a concise summary as context develops."}
                </p>
              </div>
            </div>

            {/* ACTION ITEMS PANEL */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm flex-1 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                  Action Items
                </h2>
                <div className="h-[1px] flex-1 mx-4 bg-zinc-800" />
              </div>

              <div className="space-y-3">
                {insights?.tasks && insights.tasks.length > 0 ? (
                  insights.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="group p-4 bg-zinc-950 border border-zinc-800 border-l-4 border-l-red-600 hover:bg-zinc-900 transition-all duration-200"
                    >
                      <div className="flex gap-4 items-start">
                        <CheckCircle2
                          size={18}
                          className="text-red-600 shrink-0 mt-0.5"
                        />
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-zinc-100 uppercase leading-tight tracking-tight group-hover:text-white">
                            {task.title}
                          </p>
                          <div className="flex gap-4 text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                            <span>@ {task.owner}</span>
                            {task.deadline !== "None" && (
                              <span className="text-red-500/70 border-l border-zinc-800 pl-4 italic">
                                Due: {task.deadline}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3 opacity-20 border border-dashed border-zinc-800">
                    <p className="text-[10px] uppercase font-black tracking-widest text-center">
                      No tasks identified yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
