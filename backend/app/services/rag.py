import os
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

# 1. Load the lightning-fast local embedding model
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# 2. Set up local ChromaDB storage
CHROMA_DB_DIR = os.path.join(os.path.dirname(__file__), "../../chroma_db")

def get_vector_store():
    return Chroma(
        persist_directory=CHROMA_DB_DIR, 
        embedding_function=embeddings, 
        collection_name="meetings"
    )

def add_meeting_to_rag(meeting_id: str, title: str, transcript: str, summary_json: dict):
    vector_store = get_vector_store()
    
    # Combine the core meeting data into a highly searchable block of text
    tasks_text = " | ".join([t.get("title", "") for t in summary_json.get("tasks", [])])
    content = f"Title: {title}\nSummary: {summary_json.get('summary', '')}\nTasks: {tasks_text}\nTranscript: {transcript}"
    
    # Create the document with metadata linking back to Postgres
    doc = Document(
        page_content=content,
        metadata={"meeting_id": str(meeting_id), "title": title}
    )
    
    # Save it to the vector database
    vector_store.add_documents([doc])

def query_meetings(question: str, k=3):
    vector_store = get_vector_store()
    
    # Search the vector database for the top 3 most relevant meeting snippets
    results = vector_store.similarity_search(question, k=k)
    
    if not results:
        return ""
    
    # Combine the relevant snippets into a single context string
    context = "\n\n---\n\n".join([doc.page_content for doc in results])
    return context

def delete_meeting_from_rag(meeting_id: str):
    # Ensure this directory matches where you persist your data
    vector_store = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
    # Chroma uses the metadata or ID to find and purge the specific document
    vector_store.delete(ids=[meeting_id])