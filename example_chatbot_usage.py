"""
Example usage of the MindVibe Chatbot API

This script demonstrates how to interact with the chatbot endpoint.
Note: This requires the server to be running and the database to be seeded.
"""
import requests
import json

# API Configuration
API_BASE_URL = "http://localhost:8000"
CHAT_ENDPOINT = f"{API_BASE_URL}/chat/message"

# Optional: Set user ID for authentication
USER_ID = "dev-anon"
HEADERS = {
    "Content-Type": "application/json",
    "X-Auth-UID": USER_ID
}


def send_chat_message(query: str, language: str = "en"):
    """
    Send a message to the chatbot and get a response
    
    Args:
        query: User's question or concern
        language: Response language - "en", "hi", or "sa"
    
    Returns:
        dict: Response containing AI message and relevant verses
    """
    payload = {
        "query": query,
        "language": language
    }
    
    try:
        response = requests.post(CHAT_ENDPOINT, json=payload, headers=HEADERS)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None


def print_response(response):
    """Pretty print the chatbot response"""
    if not response:
        print("No response received")
        return
    
    print("\n" + "="*70)
    print("AI RESPONSE:")
    print("="*70)
    print(response.get('response', 'No response text'))
    
    print("\n" + "-"*70)
    print("RELEVANT VERSES:")
    print("-"*70)
    
    for i, verse in enumerate(response.get('verses', []), 1):
        print(f"\n{i}. Chapter {verse['chapter']}, Verse {verse['verse']}")
        print(f"   Theme: {verse['theme']}")
        print(f"   Principle: {verse['principle']}")
        print(f"\n   Sanskrit: {verse['sanskrit']}")
        print(f"\n   English: {verse['english']}")
        print(f"\n   Hindi: {verse['hindi']}")
        print(f"\n   Relevance: {verse['relevance_score']:.2f}")
    
    print("\n" + "="*70 + "\n")


# Example queries to demonstrate the chatbot
EXAMPLE_QUERIES = [
    {
        "query": "I'm feeling anxious about my future and can't focus on my work",
        "language": "en"
    },
    {
        "query": "How do I deal with anger when things don't go my way?",
        "language": "en"
    },
    {
        "query": "मैं हमेशा चिंतित रहता हूं, मुझे क्या करना चाहिए?",
        "language": "hi"
    },
    {
        "query": "I feel like I'm not good enough and compare myself to others",
        "language": "en"
    },
    {
        "query": "How can I find inner peace in this chaotic world?",
        "language": "en"
    }
]


def main():
    """Run example queries"""
    print("\n" + "="*70)
    print("MINDVIBE CHATBOT - EXAMPLE USAGE")
    print("="*70)
    print("\nThis script demonstrates the chatbot API.")
    print("Make sure the server is running and the database is seeded.")
    print("\nServer should be started with: uvicorn main:app --reload")
    print("Database should be seeded with: python seed_gita.py")
    
    # Interactive mode
    print("\n" + "="*70)
    print("INTERACTIVE MODE")
    print("="*70)
    print("\nYou can now ask questions to the chatbot.")
    print("Type 'examples' to see example queries")
    print("Type 'quit' to exit\n")
    
    while True:
        user_input = input("Your question: ").strip()
        
        if user_input.lower() == 'quit':
            print("Goodbye!")
            break
        
        if user_input.lower() == 'examples':
            print("\nExample Queries:")
            print("-" * 70)
            for i, example in enumerate(EXAMPLE_QUERIES, 1):
                print(f"{i}. {example['query']} ({example['language']})")
            print()
            continue
        
        if not user_input:
            print("Please enter a question.\n")
            continue
        
        # Ask for language preference
        lang = input("Language (en/hi/sa) [en]: ").strip().lower() or "en"
        if lang not in ['en', 'hi', 'sa']:
            lang = 'en'
        
        print("\nProcessing your question...")
        response = send_chat_message(user_input, lang)
        
        if response:
            print_response(response)
        else:
            print("\nFailed to get response from the server.")
            print("Make sure the server is running at", API_BASE_URL)
            print()


if __name__ == "__main__":
    main()
