import os
from groq import Groq

def test_groq_vision():
    # Load env
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("GROQ_API_KEY not found")
        return
        
    client = Groq(api_key=api_key)
    print("Available vision models:")
    for m in client.models.list().data:
        if "vision" in m.id:
            print(m.id)

if __name__ == "__main__":
    test_groq_vision()
