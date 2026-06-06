export default function handler(req, res) {
  const BASE = `https://${req.headers.host}`;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.json({
    name: "IPTV Ukraine",
    version: "1.0.0",
    parameter: `menu:${BASE}/menu.json`
  });
}
