import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# We expect GEMINI_API_KEY in the .env file.
# Client initialized per-request to pick up live .env changes.

def process_content(caption: str, hashtags: list, active_categories: list) -> dict:
    """Uses LLM to categorize content and generate a 1-sentence summary."""
    load_dotenv(override=True)
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        api_key = os.getenv("OPENAI_API_KEY") # fallback or test? Actually just require GEMINI_API_KEY
    client = genai.Client(api_key=api_key)
    
    try:
        combined_text = f"Caption: {caption}\nHashtags: {' '.join(hashtags)}"
        
        # We always want 'Others' as an option
        if "Others" not in active_categories:
            active_categories.append("Others")
            
        categories_str = json.dumps(active_categories)
        
        system_prompt = f"""
        You are an assistant categorizing social media posts.
        Read the caption and hashtags provided.
        1. The FIRST tag in your "tags" list MUST exactly match ONE broad category from this exact list: {categories_str}.
        2. You may then add up to 5 additional descriptive tags/keywords related to the content for searchability.
        3. Write a concise, exactly 1-sentence summary of the post.
        Output MUST be in strictly valid JSON format exactly like this:
        {{
            "tags": ["Tech", "coding", "software", "development"],
            "summary": "This is a one-sentence summary."
        }}
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=combined_text,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                system_instruction=system_prompt,
                temperature=0.3
            )
        )
        
        result_str = response.text
        return json.loads(result_str)
        
    except Exception as e:
        print(f"AI processing error: {e}")
        return {
            "tags": ["Others"],
            "summary": "Saved successfully. (Summary unavailable)"
        }
