export default async function handler(req, res) {
  const BASE = `https://${req.headers.host}`;
  const PLAYLIST_URL = process.env.PLAYLIST_URL;

  try {
    const response = await fetch(PLAYLIST_URL);
    const text = await response.text();
    const groups = parseGroups(text);

    const menu = groups.map((group) => ({
      label: group,
      data: `${BASE}/channels.json?group=${encodeURIComponent(group)}`
    }));

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json({
      headline: "IPTV Ukraine",
      menu
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function parseGroups(m3u) {
  const groups = new Set();
  const lines = m3u.split("\n");
  for (const line of lines) {
    const match = line.match(/group-title="([^"]*)"/);
    if (match && match[1]) groups.add(match[1]);
  }
  return [...groups];
}
