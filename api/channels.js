module.exports = async function handler(req, res) {
  const PLAYLIST_URL = process.env.PLAYLIST_URL;

  try {
    const response = await fetch(PLAYLIST_URL);
    const text = await response.text();
    const channels = parseChannels(text);

    const items = channels.map((ch) => ({
      title: ch.name,
      action: `player:play:${ch.url}`
    }));

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json({
      headline: "Всі канали",
      pages: [{ items }]
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

function parseChannels(m3u) {
  const lines = m3u.split("\n");
  const channels = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("#EXTINF")) continue;

    // Формат: #EXTINF:число,Назва каналу
    const nameMatch = line.match(/,(.+)$/);
    const name = nameMatch ? nameMatch[1].trim() : "Unknown";

    // Наступний непустий рядок — URL
    let url = "";
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (next && !next.startsWith("#")) {
        url = next;
        break;
      }
    }

    if (url) {
      channels.push({ name, url });
    }
  }

  return channels;
}
