from transformers import pipeline

MODEL = "jy46604790/Fake-News-Bert-Detect"

fake_news_model = pipeline("text-classification", model=MODEL, tokenizer=MODEL)

def detect_fake_news(text: str) -> dict:
    result = fake_news_model(text)
    return {
        "label" : result[0]["label"],
        "score" : result[0]["score"] 
    }
