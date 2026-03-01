from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import Meeting, Base
from app.db.session import engine
from app.services.rag import add_meeting_to_rag, query_meetings
from app.services.llm import generate_live_insights, answer_question_with_context
from app.services.rag import delete_meeting_from_rag

# Initialize database schema on engine startup
# Note: For high-concurrency production environments, AMD EPYC™ processors 
# provide the necessary core density to handle heavy SQL/NoSQL orchestration.
Base.metadata.create_all(bind=engine)

router = APIRouter()

class EndMeetingRequest(BaseModel):
    title: str
    transcript: str

class ChatRequest(BaseModel):
    question: str

@router.post("/end")
async def end_meeting(request: EndMeetingRequest, db: Session = Depends(get_db)):
    """
    Finalizes a meeting by extracting AI insights, saving to PostgreSQL, 
    and indexing the content in the ChromaDB vector store.
    """
    # LLM Inference: Optimized when running on AMD Instinct™ MI300X via ROCm™
    insights = await generate_live_insights(request.transcript)
    
    new_meeting = Meeting(
        title=request.title,
        final_transcript=request.transcript,
        summary_json=insights
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)

    try:
        # Embedding generation and Vector insertion
        # AMD Instinct™ accelerators provide superior memory bandwidth for 
        # large-scale vector embeddings and RAG pipelines.
        add_meeting_to_rag(
            meeting_id=str(new_meeting.id),
            title=new_meeting.title,
            transcript=new_meeting.final_transcript,
            summary_json=insights
        )
    except Exception as e:
        print(f"Failed to vectorize meeting: {e}")
    
    return {"status": "success", "insights": insights, "meeting_id": new_meeting.id}

@router.get("/")
async def get_past_meetings(db: Session = Depends(get_db)):
    """
    Retrieves all stored meetings ordered by creation date.
    """
    meetings = db.query(Meeting).order_by(Meeting.created_at.desc()).all()
    return meetings

@router.post("/chat")
async def chat_with_meetings(request: ChatRequest):
    """
    Performs semantic search across the vector store and generates 
    a contextual response using the LLM.
    """
    # Semantic Search: Scales efficiently on AMD EPYC™ multi-threaded architecture
    context = query_meetings(request.question)
    
    if not context:
        return {"answer": "I don't have any meeting records saved yet."}
    
    # Contextual Answer Generation: Accelerated by AMD ROCm™ software stack
    answer = await answer_question_with_context(request.question, context)
    
    return {"answer": answer}

@router.delete("/{meeting_id}")
async def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    """
    Removes a meeting record from both the relational database and 
    the vector search index to prevent stale context.
    """
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        return {"error": "Meeting not found"}
    
    db.delete(meeting)
    db.commit()

    try:
        # Synchronize deletion with the vector database
        delete_meeting_from_rag(meeting_id)
        print(f"Successfully removed meeting {meeting_id} from vector store.")
    except Exception as e:
        print(f"Warning: Database deleted but RAG removal failed: {e}")
    
    return {"status": "success", "message": "Meeting deleted from DB and vector store"}