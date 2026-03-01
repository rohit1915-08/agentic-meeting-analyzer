import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from datetime import datetime
from langchain_ollama import ChatOllama

# 🚀 AMD ZEN OPTIMIZATION: Hardware-Mapped Inference via Ollama
# Change '8' to match your Ryzen's EXACT physical core count
PHYSICAL_CORES = 8

llm = ChatOllama(
    model="llama3.1:8b",
    temperature=0.1,
    # Injecting hardware-specific run parameters into the Ollama backend
    num_thread=PHYSICAL_CORES,  # Prevents virtual thread context switching
    num_ctx=4096                # Pre-allocates memory for RAG context
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
    6. DEADLINE CONVERSION: You MUST convert all relative deadlines (like "tomorrow", "Friday", "next week") into absolute, exact calendar dates using today's date. 
       *RULE*: Treat "next [Day]" (e.g., "next Friday") as the VERY NEXT occurrence of that day on the calendar (within the upcoming 7 days), NOT the week after. If no deadline is mentioned, output "None".
    
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
    qa_prompt = PromptTemplate(
        input_variables=["question", "context"],
        template="""
        You are an elite executive AI assistant. Answer the user's question based strictly on the meeting context provided below.
        If the context does not contain the answer, politely state that you do not have that information in your meeting records. DO NOT invent or hallucinate answers.

        Meeting Context:
        {context}

        Question: {question}
        """
    )
    chain = qa_prompt | llm | StrOutputParser()
    response = await chain.ainvoke({"question": question, "context": context})
    return response