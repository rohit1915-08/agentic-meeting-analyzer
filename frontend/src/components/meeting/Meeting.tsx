import React from "react";
import { useAudioStream } from "../../hooks/useAudioStream";
import { Mic, Square, CheckCircle2 } from "lucide-react";

export const Meeting: React.FC = () => {
  const { isRecording, transcript, insights, startRecording, stopRecording } =
    useAudioStream();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Live Agentic Meeting
        </h1>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-colors ${
            isRecording
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-5 h-5" /> Stop Meeting
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" /> Start Meeting
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 min-h-125 shadow-sm flex flex-col">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Live Transcript
          </h2>
          <div className="flex-1 overflow-y-auto prose max-w-none">
            {transcript ? (
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {transcript}
              </p>
            ) : (
              <p className="text-gray-400 italic">
                {isRecording ? "Listening..." : "Click 'Start' to begin."}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-indigo-800 uppercase tracking-wider mb-3">
              Live Summary
            </h2>
            <p className="text-indigo-900 text-sm leading-relaxed">
              {insights?.summary ||
                "Waiting for enough context to generate summary..."}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex-1">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Detected Tasks
            </h2>
            <div className="space-y-3">
              {insights?.tasks && insights.tasks.length > 0 ? (
                insights.tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 border border-gray-100 rounded-md flex gap-3 items-start"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {task.title}
                      </p>
                      <div className="flex gap-2 mt-1 text-xs text-gray-500">
                        <span className="bg-gray-200 px-2 py-0.5 rounded-full">
                          {task.owner}
                        </span>
                        {task.deadline !== "None" && (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            {task.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No tasks detected yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
