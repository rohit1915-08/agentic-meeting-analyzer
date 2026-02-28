import numpy as np
from faster_whisper import WhisperModel
import os

# Using small model for accuracy
MODEL_SIZE = "small"
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

async def process_audio_chunk(audio_bytes: bytes) -> str:
    try:
        audio_data = np.frombuffer(audio_bytes, np.int16).astype(np.float32) / 32768.0
        
        # Added VAD filter and context prompting for massive accuracy boost
        segments, info = model.transcribe(
            audio_data, 
            beam_size=5, 
            language="en",
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=300),
            initial_prompt="Meeting context: Let's discuss agendas, tasks, deadlines, and assign action items to people like Rohit and Sarah."
        )
        
        transcription = " ".join([segment.text for segment in segments]).strip()
        return transcription
        
    except Exception as e:
        print(f"Transcription error: {e}")
        return ""

def generate_final_diarized_transcript(audio_file_path: str):
    from pyannote.audio import Pipeline
    
    hf_token = os.getenv("HUGGINGFACE_TOKEN")
    if not hf_token:
        raise ValueError("HUGGINGFACE_TOKEN missing for Pyannote diarization.")
        
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=hf_token
    )
    
    return pipeline(audio_file_path)