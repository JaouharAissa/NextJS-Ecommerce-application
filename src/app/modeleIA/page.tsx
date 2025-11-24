"use client";
import { useState } from "react";
export default function ModeleIAPage() {
const [prediction, setPrediction] = useState<number | null>(null);
const predire = async () => {
const res = await fetch("http://127.0.0.1:5000/api/predict", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ features: [6] }),
});
const data = await res.json();
setPrediction(data.prediction[0]);
};
return (
<div style={{ textAlign: "center", marginTop: 40 }}>
<h1>📊 Prédiction avec Flask</h1>

<button onClick={predire}>Faire une 
prédiction</button>
{prediction !== null && <p>Résultat : {prediction}</p>}
</div>
);
}
