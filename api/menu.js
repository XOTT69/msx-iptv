module.exports = async function handler(req, res) {
  const BASE = `https://${req.headers.host}`;

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.json({
    headline: "IPTV Ukraine",
    menu: [
      {
        label: "Всі канали",
        data: `${BASE}/channels.json`
      }
    ]
  });
};
