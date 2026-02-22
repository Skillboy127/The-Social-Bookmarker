import re
import random
import requests
from bs4 import BeautifulSoup

def extract_url(text: str) -> tuple[str, str]:
    """Extracts first URL found and returns the rest of the text as a user note."""
    url_pattern = re.compile(r'(https?://[^\s]+)')
    match = url_pattern.search(text)
    if match:
        url = match.group(1)
        note = text.replace(url, "").strip()
        return url, note
    return None, ""

async def scrape_post(url: str):
    print(f"Scraping data for {url}...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    
    try:
        # Use oEmbed API for YouTube links because standard requests often get JS-wall blocked
        if 'youtube.com' in url or 'youtu.be' in url:
            # Convert shorts URL format to watch format so the oEmbed API accepts it
            oembed_target = url
            if 'youtube.com/shorts/' in url:
                video_id = url.split('/shorts/')[1].split('?')[0]
                oembed_target = f"https://www.youtube.com/watch?v={video_id}"
                
            oembed_url = f"https://www.youtube.com/oembed?url={oembed_target}&format=json"
            res = requests.get(oembed_url, timeout=10)
            if res.status_code == 200:
                data = res.json()
                content = f"{data.get('title', '')} - by {data.get('author_name', '')}"
                hashtags = [] # YouTube oEmbed doesn't return hashtags easily, but AI can categorize from title
                return content, hashtags
                
        # Standard scraping for Instagram and other platforms
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        
        title = soup.find("meta", property="og:title")
        desc = soup.find("meta", property="og:description")
        
        parts = []
        if title and title.get("content"):
            parts.append(title["content"])
        if desc and desc.get("content"):
            parts.append(desc["content"])
            
        if parts:
            content = " - ".join(parts).strip()
            hashtags = re.findall(r'#\w+', content)
            return content, hashtags
            
        # fallback to basic title tag if og meta tags are missing
        title_tag = soup.find("title")
        if title_tag:
            content = title_tag.text.strip()
            hashtags = re.findall(r'#\w+', content)
            return content, hashtags
            
    except Exception as e:
        print(f"Scraping error: {e}")
        
    # Final fallback if scraping totally fails
    return f"A link saved from {url}", []
