from fastapi import FastAPI
from pydantic import BaseModel
from models.fake_news import detect_fake_news
from models.summarizer import summarize_text
from models.keywords import extract_keywords

app = FastAPI()

class ArticleRequest(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_article(request: ArticleRequest):
    text = request.text
    
    fake_news_result = detect_fake_news(text)
    summary = summarize_text(text)
    keywords = extract_keywords(text)
    
    return {
        "is_fake": fake_news_result["label"],
        "score" : fake_news_result["score"],
        "summary": summary,
        "keywords": keywords
    }
