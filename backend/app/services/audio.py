import os
import numpy as np
from faster_whisper import WhisperModel
import torch

# 🚀 AMD ZEN OPTIMIZATION: Thread control for physical cores
# Change '8' to match your exact Ryzen physical core count
PHYSICAL_CORES = "8"
os.environ["OMP_NUM_THREADS"] = PHYSICAL_CORES
os.environ["MKL_NUM_THREADS"] = PHYSICAL_CORES
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# 🚀 AMD ZEN OPTIMIZATION: Trigger AVX-512 VNNI with int8 and physical thread locking
# MODEL_SIZE = "medium"
# model = WhisperModel(
#     MODEL_SIZE, 
#     device="cpu", 
#     compute_type="int8", # Use float32 for better compatibility with AMD CPUs
#     cpu_threads=int(PHYSICAL_CORES),
#     num_workers=1
# )

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
            initial_prompt="Meeting context: Let's discuss agendas, tasks, deadlines, and assign action items to people."
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
        
    # 🚀 AMD ZEN OPTIMIZATION: Force PyTorch to respect CPU core limits
    torch.set_num_threads(int(PHYSICAL_CORES))
        
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=hf_token
    )
    
    # Explicitly map the pipeline to the CPU to prevent GPU search overhead
    pipeline.to(torch.device("cpu"))
    
    return pipeline(audio_file_path)