import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response

from model import predict_sentiment

app = FastAPI(title="Sentiment Analysis API", version="1.0.0")

# --- Prometheus Metrics ---
REQUEST_COUNT = Counter('app_predict_requests_total', 'Total number of prediction requests')
SENTIMENT_COUNT = Counter('app_sentiment_predictions_total', 'Total sentiment predictions by class', ['sentiment_class'])
REQUEST_LATENCY = Histogram('app_predict_latency_seconds', 'Latency of predict endpoint', buckets=[0.01, 0.05, 0.1, 0.5, 1.0])

class AnalyzeRequest(BaseModel):
    text: str

@app.post("/predict")
async def predict(request: AnalyzeRequest):
    REQUEST_COUNT.inc()
    start_time = time.time()
    
    try:
        # Perform Model Inference
        result = predict_sentiment(request.text)
        
        # Log sentiment class counter
        SENTIMENT_COUNT.labels(sentiment_class=result["sentiment"]).inc()
        
        return {
            "status": "success",
            "sentiment": result["sentiment"],
            "score": result["confidence"],
            "details": f"VADER scores: {result['scores']}"
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
    finally:
        # Log latency
        REQUEST_LATENCY.observe(time.time() - start_time)

@app.get("/metrics")
async def metrics():
    """Endpoint for Prometheus to scrape."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Serve static frontend (Must be after specific routes to avoid routing conflicts)
# The frontend files should be placed in the `static/` directory relative to this script
import os
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
