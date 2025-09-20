import { useState } from "react";

export default function App(){
  const [question,setQuestion] = useState("");
  const [facts,setFacts] = useState("");
  const [resp,setResp] = useState(null);

  const ask = async () => {
    const r = await fetch("http://127.0.0.1:8000/predict",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ question, facts })
    });
    const j = await r.json();
    setResp(j);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">⚖️ Indian Law Predictor</h1>
      <textarea placeholder="Enter your legal question" value={question} onChange={e=>setQuestion(e.target.value)} className="w-full p-2 mt-2"/>
      <textarea placeholder="Facts (optional)" value={facts} onChange={e=>setFacts(e.target.value)} className="w-full p-2 mt-2"/>
      <button onClick={ask} className="bg-blue-600 text-white px-4 py-2 mt-2">Predict</button>
      {resp && (
        <div className="mt-4 border p-3">
          <p><b>Label:</b> {resp.label}</p>
          <p><b>Probability:</b> {resp.probability}%</p>
          <p><b>Reasoning:</b> {resp.reasoning}</p>
          <h3 className="mt-2 font-semibold">Evidence</h3>
          {resp.evidence.map((e,i)=>(
            <div key={i} className="mt-1 p-1 border">
              <div className="text-xs text-gray-600">{e.source_path}</div>
              <div>{e.text}</div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 text-xs text-gray-500">Educational only — not legal advice.</div>
    </div>
  );
}
