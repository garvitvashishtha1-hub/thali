import { useState } from "react";
import { foods } from "./foods";

export default function App() {
  const [query, setQuery] = useState("");

  const results = foods.filter((f) =>
    f.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <main className="app">
      <h1>Thali</h1>
      <p>Protein and calories for home-cooked veg food.</p>

      <input
        className="search"
        type="search"
        placeholder="Search dal, paneer, roti..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div>
        {results.length === 0 && <p>No match. Try "dal" or "paneer".</p>}
        {results.map((f) => (
          <div className="food" key={f.name}>
            <div>
              {f.name}
              <small>{f.serving} · {f.kcal} kcal</small>
            </div>
            <span className="protein">{f.protein} g protein</span>
          </div>
        ))}
      </div>
    </main>
  );
}