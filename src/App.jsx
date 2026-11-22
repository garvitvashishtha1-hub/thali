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

function greetingFor(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function dailyMessage(protein, target, hasLog) {
  if (!hasLog) return `Aim for ${target} g of protein today. Log your first meal to begin.`;
  const p = protein / (target || 1);
  if (p >= 1) return "Protein target done. Great job today.";
  if (p >= 0.7) return "Almost there. A katori of dahi or a handful of roasted chana can close the gap.";
  if (p >= 0.3) return "Good progress. Keep a protein source in every meal.";
  return "Just getting started. Dal, paneer or soya at your next meal will help.";
}

const GOALS = [
  ["lose", "Lose fat", "A small calorie deficit with high protein"],
  ["maintain", "Stay healthy", "Balanced calories and steady protein"],
  ["build", "Build muscle", "Extra calories and the most protein"],
];

function Welcome({ initial, onDone }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial.name || "");
  const [weight, setWeight] = useState(initial.weight || 60);
  const [goal, setGoal] = useState(initial.goal || "maintain");
  const w = Number(weight);
  const validWeight = w >= 25 && w <= 200;
  const t = calcTargets(validWeight ? w : 60, goal);

  function finish(skip) {
    onDone({
      ...initial,
      name: skip ? initial.name || "" : name.trim(),
      weight: skip || !validWeight ? initial.weight || 60 : w,
      goal: skip ? initial.goal || "maintain" : goal,
      ...(skip ? { kcal: initial.kcal, protein: initial.protein } : t),
    });
  }

  return (
    <main className="welcome">
      <div className="w-body" key={step}>
        {step === 0 && (
          <>
            <h1 className="w-title">Protein, the home-cooked way.</h1>
            <p className="w-text">
              Thali tracks calories and protein for the food you actually eat:
              roti, dal, sabzi, paneer. No powders or supplements needed.
            </p>
            <ul className="w-list">
              <li>150+ Indian vegetarian foods</li>
              <li>Targets made for your body</li>
              <li>Free, private and works offline</li>
            </ul>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="w-title">Let's set you up</h1>
            <label className="w-label">
              What should we call you? (optional)
              <input className="search" type="text" maxLength={20} value={name}
                onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </label>
            <label className="w-label">
              Body weight (kg)
              <input className="search" type="number" min="25" max="200" value={weight}
                onChange={(e) => setWeight(e.target.value)} />
            </label>
            {!validWeight && <p className="w-warn">Enter a weight between 25 and 200 kg.</p>}
            <div className="w-label">Your goal</div>
            {GOALS.map(([id, title, text]) => (
              <button key={id} className={"goal-card" + (goal === id ? " on" : "")}
                aria-pressed={goal === id} onClick={() => setGoal(id)}>
                <b>{title}</b>
                <small>{text}</small>
              </button>
            ))}
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="w-title">{name.trim() ? `All set, ${name.trim()}` : "All set"}</h1>
            <p className="w-text">Here are your daily targets.</p>
            <div className="w-big">
              <div className="tile"><b>{t.protein} g</b>protein</div>
              <div className="tile"><b>{t.kcal}</b>kcal</div>
            </div>
            <p className="note">
              These are general estimates, not medical advice. You can change them
              any time under Your targets.
            </p>
          </>
        )}
      </div>
      <div className="w-foot">
        <div className="dots" aria-hidden="true">
          {[0, 1, 2].map((i) => <span key={i} className={i === step ? "on" : ""} />)}
        </div>
        <div>
          {step < 2 && <button className="w-link" onClick={() => finish(true)}>Skip</button>}
          {step > 0 && <button className="w-link" onClick={() => setStep(step - 1)}>Back</button>}
          <button className="w-next" disabled={step === 1 && !validWeight}
            onClick={() => (step < 2 ? setStep(step + 1) : finish(false))}>
            {step < 2 ? "Next" : "Start tracking"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2000);
    const t2 = setTimeout(() => onDone(false), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  function skip() {
    setLeaving(true);
    setTimeout(() => onDone(false), 350);
  }

  return (
    <div
      className={"splash" + (leaving ? " leave" : "")}
      onClick={skip}
      role="button"
      tabIndex={0}
      aria-label="Skip intro"
    >
      <svg className="splash-ring" width="120" height="120" viewBox="0 0 132 132">
        <circle cx="66" cy="66" r="56" className="splash-track" />
        <circle cx="66" cy="66" r="56" className="splash-arc" />
      </svg>
      <h1 className="splash-name">Thali</h1>
      <p className="splash-tag">Protein and calories for home-cooked veg food.</p>
    </div>
  );
}

function ThemeIcon({ sun }) {
  return (
    <svg
      className={"theme-icon" + (sun ? " is-sun" : "")}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <mask id="thali-moon-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect x="0" y="0" width="24" height="24" fill="#fff" />
        <circle className="moon-cut" cx="17" cy="7" r="7.5" fill="#000" />
      </mask>
      <g mask="url(#thali-moon-mask)">
        <circle className="sun-core" cx="12" cy="12" r="9" fill="currentColor" />
      </g>
      <g className="sun-rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line key={deg} x1="12" y1="1.5" x2="12" y2="4" transform={`rotate(${deg} 12 12)`} />
        ))}
      </g>
    </svg>
  );
}

export default function App() {
  const [profile, setProfile] = useState(() =>
    load("thali-profile", { name: "", weight: 60, goal: "maintain", ...calcTargets(60, "maintain") })
  );
  const [log, setLog] = useState(() => {
    const s = load("thali-log", null);
    return s && s.day === today() ? s.items : [];
  });
  const [meal, setMeal] = useState("Breakfast");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [limit, setLimit] = useState(12);
  const [theme, setTheme] = useState(() => load("thali-theme", "auto"));
  const [ready, setReady] = useState(false);
  const [welcomed, setWelcomed] = useState(() => load("thali-welcomed", false));
  const [showSplash, setShowSplash] = useState(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const last = load("thali-splash", 0);
    return !calm && Date.now() - last > 30 * 60 * 1000;
  });

  useEffect(() => {
    if (showSplash) {
      save("thali-splash", Date.now());
      return;
    }
    if (!welcomed) return;
    const id = setTimeout(() => setReady(true), 350);
    return () => clearTimeout(id);
  }, [showSplash, welcomed]);
  const [installEvt, setInstallEvt] = useState(null);
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
  );
  const [hideInstall, setHideInstall] = useState(() => load("thali-hide-install", false));
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => save("thali-profile", profile), [profile]);
  useEffect(() => save("thali-log", { day: today(), items: log }), [log]);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    save("thali-theme", theme);
    const root = document.documentElement;
    if (theme === "auto") root.removeAttribute("data-theme");
    else root.dataset.theme = theme;
    const dark =
      theme === "dark" ||
      (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#141a16" : "#2f7d4f");
  }, [theme]);

  const isDark =
    theme === "dark" ||
    (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  async function installApp() {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice;
    setInstallEvt(null);
  }

  function hideBanner() {
    setHideInstall(true);
    save("thali-hide-install", true);
  }

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

  if (showSplash) return <Splash onDone={setShowSplash} />;

  if (!welcomed)
    return (
      <Welcome
        initial={profile}
        onDone={(p) => {
          setProfile(p);
          setWelcomed(true);
          save("thali-welcomed", true);
        }}
      />
    );

  return (
    <main className="app">
      <div className="head">
        <h1>Thali</h1>
        <button
          className="theme-btn"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <ThemeIcon sun={isDark} />
        </button>
      </div>
      <div className="hello">
        <p className="date">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h2 className="greet">
          {greetingFor(new Date().getHours())}
          {profile.name ? `, ${profile.name}` : ""}
        </h2>
        <p className="tip">{dailyMessage(protein, profile.protein, log.length > 0)}</p>
      </div>

      {!installed && !hideInstall && (installEvt || isIOS) && (
        <section className="card install">
          <div>
            <b>Install Thali</b>
            <p className="hint">
              {installEvt
                ? "Add it to your home screen. It opens full screen and works offline."
                : "In Safari, tap the Share icon, then Add to Home Screen."}
            </p>
          </div>
          <div className="install-actions">
            {installEvt && (
              <button className="install-btn" onClick={installApp}>
                Install app
              </button>
            )}
            <button className="x" onClick={hideBanner} aria-label="Dismiss">×</button>
          </div>
        </section>
      )}

      <section className="card today">
        <div className="ring">
          <svg width="132" height="132" viewBox="0 0 132 132">
            <circle cx="66" cy="66" r={R} className="ring-bg" />
            <circle
              cx="66" cy="66" r={R}
              className="ring-fill"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - (ready ? pct : 0))}
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
          <label className="wide">
            Your name
            <input
              type="text"
              maxLength={20}
              value={profile.name || ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </label>
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
