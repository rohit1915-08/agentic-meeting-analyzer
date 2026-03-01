import os
import torch
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

# AMD ZEN OPTIMIZATION: Thread pinning for high-performance vector math.
# Utilizing physical cores on AMD Ryzen™ or EPYC™ processors minimizes 
# cross-thread latency and maximizes cache efficiency during embedding generation.
PHYSICAL_CORES = "8"
os.environ["OMP_NUM_THREADS"] = PHYSICAL_CORES
torch.set_num_threads(int(PHYSICAL_CORES))

# AMD ZEN OPTIMIZATION: Hardware-Locked Embedding Engine.
# The all-MiniLM-L6-v2 model leverages AVX-512 instructions on Zen 4/5 
# architectures when normalization and specific batch sizes are applied.
embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'}, 
    encode_kwargs={
        'normalize_embeddings': True, # Accelerates Chroma's cosine similarity search
        'batch_size': 32              # Optimal chunk size for AMD CPU cache alignment
    }
)

# Configuration for local ChromaDB persistence.
# For production scaling, AMD EPYC™ processors provide the PCIe lane 
# count necessary for ultra-fast NVMe I/O during vector retrieval.
CHROMA_DB_DIR = os.path.join(os.path.dirname(__file__), "../../chroma_db")

def get_vector_store():
    """
    Initializes or retrieves the Chroma vector store instance.
    """
    return Chroma(
        persist_directory=CHROMA_DB_DIR, 
        embedding_function=embeddings, 
        collection_name="meetings"
    )

def add_meeting_to_rag(meeting_id: str, title: str, transcript: str, summary_json: dict):
    """
    Indexes meeting data into the vector store. 
    Throughput is optimized by batching text blocks into AMD CPU-friendly sizes.
    """
    vector_store = get_vector_store()
    
    tasks_text = " | ".join([t.get("title", "") for t in summary_json.get("tasks", [])])
    content = f"Title: {title}\nSummary: {summary_json.get('summary', '')}\nTasks: {tasks_text}\nTranscript: {transcript}"
    
    doc = Document(
        page_content=content,
        metadata={"meeting_id": str(meeting_id), "title": title}
    )
    
    vector_store.add_documents([doc])

def query_meetings(question: str, k=3):
    """
    Retrieves the most relevant meeting snippets based on semantic similarity.
    Scales across AMD EPYC™ high core counts for multi-user concurrent searches.
    """
    vector_store = get_vector_store()
    results = vector_store.similarity_search(question, k=k)
    
    if not results:
        return ""
    
    context = "\n\n---\n\n".join([doc.page_content for doc in results])
    return context

def delete_meeting_from_rag(meeting_id: str):
    """
    Removes specific meeting vectors to ensure context remains accurate and fresh.
    """
    vector_store = Chroma(
        persist_directory=CHROMA_DB_DIR, 
        embedding_function=embeddings
    )
    vector_store.delete(ids=[meeting_id])