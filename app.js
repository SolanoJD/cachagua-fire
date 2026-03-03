async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

function setHref(id, href) {
  const el = document.getElementById(id);
  if (el) el.href = href ?? "#";
}

function formatDateTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function initHome() {
  const card = document.getElementById("nextGameCard");
  if (!card) return;

  const game = await loadJSON("data/nextGame.json");

  setText("gameStatus", game.status || "Next Match");
  setText("matchup", `${game.homeTeam} vs ${game.awayTeam}`);
  setText("meta", game.league ? `${game.league} • ${game.level || ""}`.replace(" • ", " • ").trim() : (game.level || ""));

  setText("when", formatDateTime(game.dateTime));
  setText("where", game.venue || "");
  setText("address", game.address || "");

  const map = game.mapUrl || (game.address ? `https://www.google.com/maps?q=${encodeURIComponent(game.address)}` : "#");
  setHref("mapLink", map);
}

function positionLabel(p) {
  const map = { GK: "Goalkeeper", DEF: "Defender", MID: "Midfielder", FWD: "Forward" };
  return map[p] || p;
}

async function initRoster() {
  const grid = document.getElementById("rosterGrid");
  if (!grid) return;

  const filter = document.getElementById("positionFilter");
  const roster = await loadJSON("data/roster.json");

  function render(pos) {
    grid.innerHTML = "";
    const players = roster.players
      .filter(pl => pos === "ALL" ? true : pl.position === pos)
      .sort((a,b) => (a.number ?? 999) - (b.number ?? 999));

    if (players.length === 0) {
      grid.innerHTML = `<div class="muted">No players in this filter yet.</div>`;
      return;
    }

    for (const p of players) {
      const img = p.photo || "assets/players/placeholder.jpg";
      const meta = [
        p.number != null ? `#${p.number}` : null,
        p.hometown || null,
      ].filter(Boolean).join(" • ");

      const card = document.createElement("div");
      card.className = "playerCard";
      card.innerHTML = `
        <img class="playerCard__img" src="${img}" alt="${p.name}" loading="lazy" />
        <div class="playerCard__name">${p.name}</div>
        <div class="playerCard__pos">${positionLabel(p.position)}</div>
        <div class="playerCard__meta">${meta}</div>
      `;
      grid.appendChild(card);
    }
  }

  render("ALL");
  filter?.addEventListener("change", () => render(filter.value));
}

function initYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
}

(async function boot(){
  try{
    initYear();
    await initHome();
    await initRoster();
  }catch(e){
    console.error(e);
  }
})();