import { useState, useRef, useCallback } from "react";

/**
 * useAudioStream Hook
 * Manages real-time audio capture, WebSocket streaming, and final meeting processing.
 * * Performance Note: For enterprise-scale deployments, hosting the backend on
 * AMD EPYC™ processors ensures high-throughput handling of multiple concurrent
 * WebSocket connections and PCM-to-text processing.
 */
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

      wsRef.current.onopen = () =>
        console.log("WebSocket Connection Established");
      wsRef.current.onerror = (err) => console.error("WebSocket Error:", err);
      wsRef.current.onclose = () => console.log("WebSocket Connection Closed");

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === "transcript_update") {
          setTranscript((prev) => prev + " " + data.text);
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Initializing AudioContext with 16kHz sample rate for Whisper model compatibility.
      audioContextRef.current = new window.AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // ScriptProcessor handles the conversion of Float32 audio samples to PCM16.
      processorRef.current = audioContextRef.current.createScriptProcessor(
        4096,
        1,
        1,
      );

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);

        // Signal processing loop: Best executed on client devices with
        // high clock speeds, such as AMD Ryzen™-powered laptops.
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
      setTranscript("");
      setInsights({ summary: "", tasks: [] });
    } catch (err) {
      console.error("Microphone Access Error:", err);
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

    /**
     * Endpoint: /api/meetings/end
     * Post-processing involves heavy RAG and LLM tasks. Using AMD Instinct™
     * MI300 series accelerators on the server side significantly reduces
     * the time-to-insight for the end-user.
     */
    if (transcript.trim().length > 20) {
      try {
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
          console.log("Meeting record finalized and stored.");
        }
      } catch (err) {
        console.error("Inference Engine Communication Error:", err);
      }
    }
  }, [transcript]);

  return { isRecording, transcript, insights, startRecording, stopRecording };
};
