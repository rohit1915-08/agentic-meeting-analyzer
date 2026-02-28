from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import Meeting, Base
from app.db.session import engine
from app.services.rag import add_meeting_to_rag, query_meetings
from app.services.llm import generate_live_insights, answer_question_with_context
from app.services.rag import delete_meeting_from_rag

Base.metadata.create_all(bind=engine)

router = APIRouter()

class EndMeetingRequest(BaseModel):
    title: str
    transcript: str

class ChatRequest(BaseModel):
    question: str

@router.post("/end")
async def end_meeting(request: EndMeetingRequest, db: Session = Depends(get_db)):
    # 1. Run AI Extraction
    insights = await generate_live_insights(request.transcript)
    
    # 2. Save to PostgreSQL
    new_meeting = Meeting(
        title=request.title,
        final_transcript=request.transcript,
        summary_json=insights  # Stores the summary and tasks together
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)

    # 3. Save to ChromaDB for Semantic Search
    try:
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
    # Fetch all meetings, newest first
    meetings = db.query(Meeting).order_by(Meeting.created_at.desc()).all()
    return meetings

# 🚨 CHAT ROUTE MUST BE BEFORE /{meeting_id} 🚨
@router.post("/chat")
async def chat_with_meetings(request: ChatRequest):
    # 1. Search ChromaDB for relevant meeting notes
    context = query_meetings(request.question)
    
    if not context:
        return {"answer": "I don't have any meeting records saved yet."}
    
    # 2. Pass context to Llama 3 to generate a human-readable answer
    answer = await answer_question_with_context(request.question, context)
    
    return {"answer": answer}

# 🚨 PATH PARAMETERS MUST BE LAST 🚨

@router.delete("/{meeting_id}")
async def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        return {"error": "Meeting not found"}
    
    # 1. Delete from PostgreSQL
    db.delete(meeting)
    db.commit()

    # 2. Sync with ChromaDB (Remove the "Ghost" context)
    try:
        delete_meeting_from_rag(meeting_id)
        print(f"✅ Successfully removed meeting {meeting_id} from vector store.")
    except Exception as e:
        # We don't want the whole request to fail if RAG deletion lags, 
        # but we definitely want to log it.
        print(f"⚠️ Warning: Database deleted but RAG removal failed: {e}")
    
    return {"status": "success", "message": "Meeting deleted from DB and vector store"}