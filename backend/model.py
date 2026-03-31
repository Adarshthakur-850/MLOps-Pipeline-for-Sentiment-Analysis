from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

def predict_sentiment(text: str) -> dict:
    """
    Predicts the sentiment of the provided text.
    Returns a dictionary with 'sentiment' (positive, negative, neutral) 
    and 'confidence' (compound score mapped 0-1).
    """
    scores = analyzer.polarity_scores(text)
    compound = scores['compound']
    
    # Classify based on compound score
    if compound >= 0.05:
        sentiment = "positive"
    elif compound <= -0.05:
        sentiment = "negative"
    else:
        sentiment = "neutral"
        
    # Scale compound (-1 to 1) to a confidence score (0 to 1 loosely)
    confidence = abs(compound)
    if sentiment == "neutral":
        confidence = 1.0 - abs(compound) # High certainty for neutral if close to 0
        
    # Rounding for UI
    confidence = round(confidence * 100, 1)

    return {
        "sentiment": sentiment,
        "confidence": confidence,
        "scores": scores
    }
