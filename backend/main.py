from fastapi import FastAPI, Depends, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import uvicorn
import os

from database import get_db, Bookmark, Category
import scraper
import ai_agent

app = FastAPI(title="The Social Bookmarker")

class CategoryCreate(BaseModel):
    name: str

DEFAULT_CATEGORIES = ["Gaming", "Music", "Sports", "Tech", "Memes", "Fitness", "Nutrition", "Lifestyle"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.mount("/static", StaticFiles(directory="../frontend"), name="static")

@app.get("/api/bookmarks")
def read_bookmarks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    bookmarks = db.query(Bookmark).order_by(Bookmark.timestamp.desc()).offset(skip).limit(limit).all()
    # Format tags from string to list if necessary
    results = []
    for b in bookmarks:
        tags_list = [t.strip() for t in b.tags.split(",")] if b.tags else []
        results.append({
            "id": b.id,
            "url": b.url,
            "caption": b.caption,
            "tags": tags_list,
            "summary": b.summary,
            "user_note": b.user_note,
            "ai_insight": b.ai_insight,
            "timestamp": b.timestamp
        })
    return results
@app.delete("/api/bookmarks/{bookmark_id}")
def delete_bookmark(bookmark_id: int, db: Session = Depends(get_db)):
    bookmark = db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()
    if not bookmark:
        return {"error": "Bookmark not found"}
    db.delete(bookmark)
    db.commit()
    return {"message": "Deleted successfully"}

@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).all()
    if not cats:
        # Pre-seed DB with defaults if empty
        for cat_name in DEFAULT_CATEGORIES:
            db.add(Category(name=cat_name))
        db.commit()
        cats = db.query(Category).all()
    return [c.name for c in cats]

@app.post("/api/categories")
def add_category(cat: CategoryCreate, db: Session = Depends(get_db)):
    # Standardize format
    name = cat.name.strip().title()
    existing = db.query(Category).filter(Category.name == name).first()
    if existing:
        return {"message": "Category already exists", "name": existing.name}
    new_cat = Category(name=name)
    db.add(new_cat)
    db.commit()
    return {"message": "Category added", "name": name}

@app.post("/webhook")
async def twilio_webhook(request: Request, Body: str = Form(...), From: str = Form(...), db: Session = Depends(get_db)):
    """Receives WhatsApp messages from Twilio"""
    print(f"Received message from {From}: {Body}")
    url, user_note = scraper.extract_url(Body)
    
    if not url:
        return {"message": "No valid URL found."}

    # Extract info
    caption, hashtags = await scraper.scrape_post(url)
    
    # Get active categories
    cats = db.query(Category).all()
    active_categories = [c.name for c in cats] if cats else DEFAULT_CATEGORIES
    
    # Process AI
    ai_result = ai_agent.process_content(caption, hashtags, active_categories)
    
    tags_string = ",".join(ai_result.get("tags", []))
    summary = ai_result.get("summary", "")

    # Save to DB
    new_bookmark = Bookmark(
        url=url,
        caption=caption,
        tags=tags_string,
        summary=summary,
        user_note=user_note
    )
    db.add(new_bookmark)
    db.commit()
    db.refresh(new_bookmark)

    return HTMLResponse(content="<Response><Message>Got it! I've saved this gem to your bookmarks.</Message></Response>", media_type="application/xml")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
