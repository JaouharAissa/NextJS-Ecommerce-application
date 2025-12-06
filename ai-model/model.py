from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

# Mapping des labels du modèle SST-2 : 0 = negative, 1 = positive
ID2LABEL = {0: "negative", 1: "positive"}


def analyze_sentiment(text: str):
  """
  Analyse le sentiment d'un texte en anglais.
  Retourne (sentiment: str, confidence: float)
  sentiment ∈ {"positive", "negative", "neutre"}
  """
  inputs = tokenizer(text, return_tensors="pt", truncation=True)

  with torch.no_grad():
    outputs = model(**inputs)

  scores = torch.softmax(outputs.logits, dim=1)[0]
  max_idx = int(scores.argmax().item())
  max_score = float(scores[max_idx].item())

  base_label = ID2LABEL.get(max_idx, "negative")

  # Heuristique simple pour label "neutre"
  if max_score < 0.6:
    final_label = "neutre"
  else:
    final_label = base_label

  return final_label, max_score



