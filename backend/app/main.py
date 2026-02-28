import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.services.audio import process_audio_chunk
from app.api.routes import meetings

load_dotenv()

app = FastAPI(title="Agentic Meeting Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register our new endpoint
app.include_router(meetings.router, prefix="/api/meetings", tags=["Meetings"])

@app.websocket("/ws/live-meeting")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    audio_buffer = bytearray()
    
    try:
        while True:
            data = await websocket.receive_bytes()
            audio_buffer.extend(data)
            
            if len(audio_buffer) >= 160000: # 5 seconds
                chunk_to_process = bytes(audio_buffer)
                audio_buffer.clear()
                
                transcript_chunk = await process_audio_chunk(chunk_to_process)
                
                if transcript_chunk:
                    await websocket.send_json({
                        "event": "transcript_update", 
                        "text": transcript_chunk
                    })
                
    except WebSocketDisconnect:
        pass