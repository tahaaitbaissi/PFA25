# from transformers import pipeline

# summarizer = pipeline(
#     "summarization",
#     model="facebook/bart-large-cnn",
#     device=-1
# )

# def summarize_text(text: str) -> str:
#     summary = summarizer(text, max_length=130)
#     return summary[0]["summary_text"]

from transformers import pipeline

# Initialize the BART summarization model
summarizer = pipeline(
    "summarization",
    model="facebook/bart-large-cnn",
    device=-1  # Use CPU for inference
)

def summarize_text(text: str, max_length: int = 130) -> str:
    # Maximum number of characters the model can handle in one pass
    max_input_length = 1024  # Set an appropriate limit for input text length
    
    # Split the text into chunks if it's too long
    if len(text) > max_input_length:
        chunks = [text[i:i + max_input_length] for i in range(0, len(text), max_input_length)]
    else:
        chunks = [text]

    summaries = []
    
    for chunk in chunks:
        summary = summarizer(chunk, max_length=max_length, min_length=30, do_sample=False)
        summaries.append(summary[0]["summary_text"])

    # Combine summaries of all chunks
    return " ".join(summaries)