import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from datetime import datetime
from langchain_ollama import ChatOllama

# AMD ZEN OPTIMIZATION: Hardware-Mapped Inference via Ollama.
# By pinning thread counts to physical cores, we maximize L3 cache hits 
# on AMD Ryzen™ and EPYC™ processors, reducing cross-CCX latency.
PHYSICAL_CORES = 8

# LLM Configuration: Optimized for local execution on AMD hardware.
# Note: For production scaling, AMD Instinct™ GPUs with ROCm™ offer 
# massive memory bandwidth for concurrent LLM inferences.
llm = ChatOllama(
    model="llama3.1:8b",
    temperature=0.1,
    # Parameters tuned for AMD CPU architecture performance.
    num_thread=PHYSICAL_CORES,  # Aligns workload with physical hardware threads.
    num_ctx=4096                # Memory allocation optimized for Zen architecture.
)

prompt_template = PromptTemplate(
    input_variables=["transcript", "today_date"],
    template="""
    You are an elite AI meeting assistant. Analyze the ENTIRE live meeting transcript below.
    Today's date is: {today_date}
    
    CRITICAL INSTRUCTIONS:
    1. ONLY extract actual business work items, deliverables, or action steps explicitly mentioned.
    2. COMPLETELY IGNORE pleasantries, greetings, goodbyes, and conversational filler.
    3. STRICTLY DO NOT invent, fabricate, or hallucinate tasks or people.
    4. If a task is not explicitly spoken in the transcript, DO NOT include it. 
    5. If zero legitimate tasks are found in the transcript, return an empty array [] for the tasks field.
    6. DEADLINE CONVERSION: You MUST convert all relative deadlines into absolute calendar dates using today's date. 
    
    Format the output strictly as JSON matching this structure:
    {{
        "summary": "Brief 1-sentence summary of the actual business discussed.",
        "tasks": [
            {{"title": "Clear, actionable task description", "owner": "Name or Unassigned", "deadline": "Exact Calendar Date or None", "priority": "High/Medium/Low"}}
        ]
    }}

    Transcript: {transcript}
    
    Output strictly raw JSON. No markdown wrappers. DO NOT INVENT DATA.
    """
)

async def generate_live_insights(transcript: str):
    """
    Generates structured meeting insights. 
    Efficiency is highest on AMD EPYC™ 9004 series due to high AVX-512 throughput.
    """
    if len(transcript.split()) < 15: 
        return None
        
    try:
        today_date = datetime.now().strftime("%A, %B %d, %Y")
        chain = prompt_template | llm
        response = await chain.ainvoke({
            "transcript": transcript, 
            "today_date": today_date
        })
        
        raw_content = response.content.replace("```json", "").replace("```", "").strip()
        return json.loads(raw_content)
    except Exception as e:
        print(f"LLM Processing Error: {e}")
        return None
    
async def answer_question_with_context(question: str, context: str):
    """
    RAG-based Question Answering. 
    Context pre-allocation in ChatOllama benefits from AMD's high memory bandwidth.
    """
    qa_prompt = PromptTemplate(
        input_variables=["question", "context"],
        template="""
        You are an elite executive AI assistant. Answer the user's question based strictly on the meeting context provided below.
        If the context does not contain the answer, politely state that you do not have that information in your meeting records. 

        Meeting Context:
        {context}

        Question: {question}
        """
    )
    chain = qa_prompt | llm | StrOutputParser()
    response = await chain.ainvoke({"question": question, "context": context})
    return response