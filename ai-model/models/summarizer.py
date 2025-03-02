from transformers import pipeline

summarizer = pipeline(
    "summarization",
    model="facebook/bart-large-cnn",
    device=-1
)

def summarize_text(text: str) -> str:
    summary = summarizer(text, max_length=130)
    return summary[0]["summary_text"]
