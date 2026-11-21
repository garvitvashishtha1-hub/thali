import { useState, useEffect } from "react";
import { foods, categories } from "./foods";

const MEALS = ["Breakfast", "Lunch", "Snack", "Dinner"];
const today = () => new Date().toDateString();
const r1 = (x) => Math.round(x * 10) / 10;

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

function calcTargets(weight, goal) {
  const base = weight * 31;
  const adj = goal === "lose" ? -400 : goal === "build" ? 300 : 0;
  const perKg = goal === "build" ? 1.8 : goal === "lose" ? 1.5 : 1.2;
  return {
    kcal: Math.round((base + adj) / 50) * 50,
    protein: Math.round(weight * perKg),
  };
}

export default function App() {
  const [profile, setProfile] = useState(() =>
    load("thali-profile", { weight: 60, goal: "maintain", ...calcTargets(60, "maintain") })
  );
  const [log, setLog] = useState(() => {
    const s = load("thali-log", null);
    return s && s.day === today() ? s.items : [];
  });
  const [meal, setMeal] = useState("Breakfast");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [limit, setLimit] = useState(12);

  useEffect(() => save("thali-profile", profile), [profile]);
  useEffect(() => save("thali-log", { day: today(), items: log }), [log]);

  function changeBody(patch) {
    const next = { ...profile, ...patch };
    setProfile({ ...next, ...calcTargets(next.weight || 60, next.goal) });
  }

  function addFood(food) {
    setLog((prev) => {
      const hit = prev.find((i) => i.name === food.name && i.meal === meal);
      if (hit) {
        return prev.map((i) => (i === hit ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...food, qty: 1, meal }];
    });
  }

  function changeQty(item, delta) {
    setLog((prev) =>
      prev
        .map((i) => (i === item ? { ...i, qty: r1(i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );
  }

  const sum = (key) => log.reduce((t, i) => t + i[key] * i.qty, 0);
  const protein = sum("protein");
  const kcal = sum("kcal");
  const left = profile.protein - protein;
  const R = 56;
  const C = 2 * Math.PI * R;
  const pct = Math.min(1, protein / (profile.protein || 1));

  const matches = foods.filter(
    (f) =>
      (cat === "All" || f.category === cat) &&
      f.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const results = matches.slice(0, limit);
  const best = [...foods]
    .filter((f) => f.protein >= 5)
    .sort((a, b) => b.protein / b.kcal - a.protein / a.kcal)
    .slice(0, 5);

  return (
    <main className="app">
      <h1>Thali</h1>
      <p>Protein and calories for home-cooked veg food.</p>

      <section className="card today">
        <div className="ring">
          <svg width="132" height="132" viewBox="0 0 132 132">
            <circle cx="66" cy="66" r={R} className="ring-bg" />
            <circle
              cx="66" cy="66" r={R}
              className="ring-fill"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
            />
          </svg>
          <div className="ring-text">
            <b>{Math.round(protein)}</b>
            <span>of {profile.protein} g protein</span>
          </div>
        </div>
        <div>
          <b>{Math.round(kcal)}</b> / {profile.kcal} kcal
          <p className="hint">
            {log.length === 0
              ? "Nothing logged yet. Add your first food below."
              : left <= 0
              ? "Protein target reached. Nice work."
              : `${Math.round(left)} g protein to go.`}
          </p>
        </div>
      </section>

      {log.length > 0 && left > 0 && (
        <section className="card">
          <h2>Most protein for the calories</h2>
          <div className="chips">
            {best.map((f) => (
              <button key={f.name} className="chip" onClick={() => addFood(f)}>
                {f.name} · {f.protein} g
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2>Today's meals</h2>
        {log.length === 0 && <p className="hint">Your meals will show up here.</p>}
        {MEALS.map((m) => {
          const items = log.filter((i) => i.meal === m);
          if (items.length === 0) return null;
          const mp = items.reduce((t, i) => t + i.protein * i.qty, 0);
          return (
            <div key={m}>
              <h3>{m} · {Math.round(mp)} g protein</h3>
              {items.map((i) => (
                <div className="food" key={i.name + i.meal}>
                  <div>
                    {i.name}
                    <small>
                      {i.qty} × {i.serving} · {Math.round(i.kcal * i.qty)} kcal
                    </small>
                  </div>
                  <span className="stepper">
                    <button onClick={() => changeQty(i, -0.5)} aria-label={"Less " + i.name}>−</button>
                    <span className="protein">{r1(i.protein * i.qty)} g</span>
                    <button onClick={() => changeQty(i, 0.5)} aria-label={"More " + i.name}>+</button>
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2>Add food</h2>
        <h3>Add to</h3>
        <div className="chips">
          {MEALS.map((m) => (
            <button
              key={m}
              className={"chip" + (m === meal ? " on" : "")}
              aria-pressed={m === meal}
              onClick={() => setMeal(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <h3>Browse</h3>
        <div className="cats">
          {categories.map((c) => (
            <button
              key={c}
              className={"chip" + (c === cat ? " on" : "")}
              aria-pressed={c === cat}
              onClick={() => { setCat(c); setLimit(12); }}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search dal, paneer, roti..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setLimit(12); }}
        />
        {matches.length === 0 && <p>No match. Try "dal" or "paneer".</p>}
        {results.map((f) => (
          <div className="food" key={f.name}>
            <div>
              {f.name}
              <small>{f.serving} · {f.kcal} kcal</small>
            </div>
            <span>
              <span className="protein">{f.protein} g</span>
              <button className="add" onClick={() => addFood(f)}>Add to {meal}</button>
            </span>
          </div>
        ))}
        {matches.length > limit && (
          <button className="more" onClick={() => setLimit(limit + 12)}>
            Show more ({matches.length - limit} left)
          </button>
        )}
      </section>

      <section className="card">
        <h2>Your targets</h2>
        <div className="grid">
          <label>
            Body weight (kg)
            <input
              type="number" min="25" max="200"
              value={profile.weight}
              onChange={(e) => changeBody({ weight: Number(e.target.value) })}
            />
          </label>
          <label>
            Goal
            <select value={profile.goal} onChange={(e) => changeBody({ goal: e.target.value })}>
              <option value="lose">Lose fat</option>
              <option value="maintain">Maintain</option>
              <option value="build">Build muscle</option>
            </select>
          </label>
          <label>
            Calories per day
            <input
              type="number"
              value={profile.kcal}
              onChange={(e) => setProfile({ ...profile, kcal: Number(e.target.value) })}
            />
          </label>
          <label>
            Protein (g) per day
            <input
              type="number"
              value={profile.protein}
              onChange={(e) => setProfile({ ...profile, protein: Number(e.target.value) })}
            />
          </label>
        </div>
        <p className="note">
          Values are typical home-cooked estimates and vary with oil and recipe.
          This is a general guide, not medical advice.
        </p>
      </section>
    </main>
  );
}
