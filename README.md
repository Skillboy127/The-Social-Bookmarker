# 📱 The Social Saver
**Your AI-Powered Content Curation Assistant via WhatsApp**
Ever find a highly valuable Instagram Reel or Post but lose it in your Saved folder? *The Social Saver* solves this by allowing you to forward any Instagram link to a WhatsApp bot. The system automatically extracts the caption, uses AI to tag, categorize, and summarize the content, and saves it to a beautiful, searchable web dashboard for your personal knowledge base.
---
## 🎥 Demo Video
[![The Social Saver Demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)
> *Replace `YOUR_VIDEO_ID` with your actual YouTube ID, or delete this and drag-and-drop your `.mp4` / `.gif` directly here when editing on GitHub!*
---
## 🏗️ Architecture Diagram
Here is the high-level flow of how *The Social Saver* processes your messages:
```mermaid
flowchart TD
    %% Nodes with unique shapes
    User(["User on WhatsApp"])
    Twilio[/"Twilio Webhook"/]
    FlaskApp["Python Flask Backend"]
    Scraper[["Insta Scraper Script"]]
    Gemini{{"Gemini API"}}
    DB[("MongoDB Database")]
    Frontend(["React Dashboard"])
    %% Flow connections
    User -->|"Sends reel link"| Twilio
    Twilio -->|"POST request"| FlaskApp
    FlaskApp -->|"Gets video URL"| Scraper
    Scraper -->|"Returns caption"| FlaskApp
    FlaskApp -->|"Send text to summarize"| Gemini
    Gemini -->|"Returns summary and tags"| FlaskApp
    FlaskApp -->|"Save to DB"| DB
    FlaskApp -->|"Send Success Msg"| Twilio
    Twilio -->|"Done!"| User
    
    DB -.->|"Fetch saved posts"| Frontend
    %% Styling and colors
    classDef userNode fill:#25D366,stroke:#128C7E,stroke-width:2px,color:#fff;
    classDef apiNode fill:#8E44AD,stroke:#5B2C6F,stroke-width:2px,color:#fff;
    classDef backendNode fill:#2C3E50,stroke:#1A252F,stroke-width:2px,color:#fff;
    classDef frontendNode fill:#3498DB,stroke:#2980B9,stroke-width:2px,color:#fff;
    classDef dbNode fill:#F1C40F,stroke:#D4AC0D,stroke-width:2px,color:#333;
    class User userNode;
    class Twilio,Gemini,Scraper apiNode;
    class FlaskApp backendNode;
    class DB dbNode;
    class Frontend frontendNode;
```
---
## ✨ Key Features
- **Frictionless Capture:** Just forward links natively via WhatsApp.
- **Automated Extraction:** Pulls context and captions directly from the URL.
- **AI-Powered Organization:** Automatically categorizes content, extracts keywords, and generates summaries.
- **Searchable Dashboard:** Filter, search, and review all your saved knowledge in a clean UI.
---
## 💻 Tech Stack
- **Backend API:** Python, Flask
- **Messaging:** Twilio API for WhatsApp / Meta Cloud API
- **AI capabilities:** Gemini API (for summaries and classification)
- **Database:** (Insert your DB here, e.g., PostgreSQL, MongoDB)
- **Frontend Dashboard:** (Insert your frontend tech here, e.g., React, Next.js, HTML/CSS)
---
## 🚀 Local Setup & Installation
### Prerequisites
- Python 3.8+
- ngrok (for local webhook testing)
- API Keys for your AI provider and Messaging service
### 1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/the-social-saver.git
cd the-social-saver
\`\`\`
### 2. Set up a virtual environment
\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
\`\`\`
### 3. Install dependencies
\`\`\`bash
pip install -r requirements.txt
\`\`\`
### 4. Configure Environment Variables
Create a `.env` file in the root directory and add your credentials:
\`\`\`env
WHATSAPP_TOKEN=your_token_here
AI_API_KEY=your_api_key_here
DATABASE_URL=your_db_url_here
\`\`\`
### 5. Run the server
\`\`\`bash
python app.py
\`\`\`
*Ensure you expose your local port using `ngrok` to receive webhooks from the WhatsApp bot!*
