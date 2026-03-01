import os
import torch
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

# 🚀 AMD ZEN OPTIMIZATION 1: Thread pinning for vector math
# Change '8' to match your Ryzen's physical core count
PHYSICAL_CORES = "8"
os.environ["OMP_NUM_THREADS"] = PHYSICAL_CORES
torch.set_num_threads(int(PHYSICAL_CORES))

# 🚀 AMD ZEN OPTIMIZATION 2: Hardware-Locked Embedding Engine
# Explicitly target the CPU and optimize batching for the Zen L3 cache
embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'}, 
    encode_kwargs={
        'normalize_embeddings': True, # Speeds up Chroma's cosine similarity search
        'batch_size': 32              # Optimal chunk size for AVX instructions
    }
)

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
    # Fixed bug: Replaced hardcoded path with your dynamic CHROMA_DB_DIR
    vector_store = Chroma(
        persist_directory=CHROMA_DB_DIR, 
        embedding_function=embeddings
    )
    vector_store.delete(ids=[meeting_id])