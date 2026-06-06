module.exports = async function handler(req, res) {
  const PLAYLIST_URL = process.env.PLAYLIST_URL;
  const group = req.query.group || "";

  try {
    const response = await fetch(PLAYLIST_URL);
    const text = await response.text();
    const channels = parseChannels(text, group);

    const items = channels.map((ch) => ({
      title: ch.name,
      image: ch.logo || "",
      action: `player:play:${ch.url}`
    }));

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json({
      headline: group || "Всі канали",
      pages: [{ items }]
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

function parseChannels(m3u, filterGroup) {
  const lines = m3u.split("\n");
  const channels = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("#EXTINF")) continue;

    const groupMatch = line.match(/group-title="([^"]*)"/);
    const logoMatch = line.match(/tvg-logo="([^"]*)"/);
    const nameMatch = line.match(/,(.+)$/);

    const group = groupMatch ? groupMatch[1] : "";
    const logo = logoMatch ? logoMatch[1] : "";
    const name = nameMatch ? nameMatch[1].trim() : "Unknown";

    let url = "";
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (next && !next.startsWith("#")) {
        url = next;
        break;
      }
    }

    if (filterGroup && group !== filterGroup) continue;
    if (url) {
      channels.push({ name, logo, url, group });
    }
  }

  return channels;
}
