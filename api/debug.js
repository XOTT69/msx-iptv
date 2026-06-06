module.exports = async function handler(req, res) {
  const PLAYLIST_URL = process.env.PLAYLIST_URL;

  try {
    const response = await fetch(PLAYLIST_URL);
    const text = await response.text();
    
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json({
      status: response.status,
      length: text.length,
      first500: text.substring(0, 500),
      hasExtinf: text.includes("#EXTINF"),
      hasGroupTitle: text.includes("group-title"),
      sampleLines: text.split("\n").slice(0, 20)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
