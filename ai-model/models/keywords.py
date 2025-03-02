from keybert import KeyBERT

kw_model = KeyBERT()

def extract_keywords(text: str) -> list:
    keywords = kw_model.extract_keywords(text)
    return [kw[0] for kw in keywords]
