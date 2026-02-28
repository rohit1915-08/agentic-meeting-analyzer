import { useState, useRef, useCallback } from "react";

export const useAudioStream = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [insights, setInsights] = useState<{ summary: string; tasks: any[] }>({
    summary: "",
    tasks: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      wsRef.current = new WebSocket("ws://localhost:8000/ws/live-meeting");

      wsRef.current.onopen = () => console.log("✅ WebSocket Connected");
      wsRef.current.onerror = (err) =>
        console.error("❌ WebSocket Error:", err);
      wsRef.current.onclose = () => console.log("🔌 WebSocket Disconnected");

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === "transcript_update") {
          setTranscript((prev) => prev + " " + data.text);
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new window.AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);

      processorRef.current = audioContextRef.current.createScriptProcessor(
        4096,
        1,
        1,
      );

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(pcm16.buffer);
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      setIsRecording(true);
      // Reset state for new meeting
      setTranscript("");
      setInsights({ summary: "", tasks: [] });
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (processorRef.current && audioContextRef.current) {
      processorRef.current.disconnect();
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    setIsRecording(false);

    // Trigger enterprise AI extraction and DB save on meeting end
    if (transcript.trim().length > 20) {
      try {
        console.log("Processing final meeting insights...");
        const response = await fetch("http://localhost:8000/api/meetings/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Meeting ${new Date().toLocaleDateString()}`,
            transcript: transcript.trim(),
          }),
        });

        const data = await response.json();
        if (data.insights) {
          setInsights(data.insights);
          console.log("✅ Meeting saved to database!");
        }
      } catch (err) {
        console.error("Failed to process meeting:", err);
      }
    }
  }, [transcript]);

  return { isRecording, transcript, insights, startRecording, stopRecording };
};
