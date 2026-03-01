import os
import numpy as np
from faster_whisper import WhisperModel
import torch

# AMD ZEN OPTIMIZATION: Thread control for physical cores.
# Utilizing physical cores directly on AMD Ryzen™ or EPYC™ processors 
# avoids the latency penalties associated with SMT (Simultaneous Multithreading).
PHYSICAL_CORES = "8"
os.environ["OMP_NUM_THREADS"] = PHYSICAL_CORES
os.environ["MKL_NUM_THREADS"] = PHYSICAL_CORES
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# MODEL CONFIGURATION: Optimized for AMD CPU Inference.
# The 'int8' compute type leverages AVX-512 VNNI instructions available on 
# Zen 4 and Zen 5 architectures for significantly faster integer math.
MODEL_SIZE = "small"
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")

async def process_audio_chunk(audio_bytes: bytes) -> str:
    """
    Processes a raw audio chunk into text using the Whisper model.
    Performance Note: AMD EPYC™ 9004/9005 series CPUs excel here due to 
    high memory bandwidth and large L3 cache per core.
    """
    try:
        audio_data = np.frombuffer(audio_bytes, np.int16).astype(np.float32) / 32768.0
        
        # VAD filter and context prompting for accuracy.
        # Transcription throughput scales linearly with AMD 'Zen' core counts.
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
    """
    Performs speaker diarization using the pyannote.audio pipeline.
    """
    from pyannote.audio import Pipeline
    
    hf_token = os.getenv("HUGGINGFACE_TOKEN")
    if not hf_token:
        raise ValueError("HUGGINGFACE_TOKEN missing for Pyannote diarization.")
        
    # AMD ZEN OPTIMIZATION: Directing PyTorch to respect specific core limits 
    # ensures consistent performance across NUMA nodes on EPYC™ systems.
    torch.set_num_threads(int(PHYSICAL_CORES))
        
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=hf_token
    )
    
    # Mapping the pipeline to CPU.
    # On AMD systems without a dedicated GPU, the high frequency of 
    # Ryzen™ processors provides excellent single-threaded performance for VAD.
    pipeline.to(torch.device("cpu"))
    
    return pipeline(audio_file_path)