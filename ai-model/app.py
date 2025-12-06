from fastapi import FastAPI
from pydantic import BaseModel
from model import analyze_sentiment


app = FastAPI()


class AnalyzePayload(BaseModel):
  text: str


@app.post("/analyze")
def analyze_text(payload: AnalyzePayload):
  """
  Endpoint d'analyse de sentiment.
  Attendu: { "text": "your english text" }
  Retour: { "sentiment": "...", "confidence": 0.x }
  """
  sentiment, confidence = analyze_sentiment(payload.text)
  return {
    "sentiment": sentiment,
    "confidence": confidence,
  }


if __name__ == "__main__":
  import uvicorn

  uvicorn.run("app:app", host="0.0.0.0", port=4000, reload=True)



