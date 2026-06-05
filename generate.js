const fs = require("fs");
const path = require("path");

const BASE = "https://msx-iptv.vercel.app";

const dist = path.join(__dirname, "public");

if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}

fs.mkdirSync(dist, { recursive: true });

const startJson = {
  name: "IPTV Ukraine",
  version: "1.0.0",
  parameter: "menu:" + BASE + "/menu.json"
};

fs.writeFileSync(
  path.join(dist, "start.json"),
  JSON.stringify(startJson, null, 2)
);

const menuJson = {
  headline: "IPTV Ukraine",
  menu: [
    {
      label: "Тестовий канал",
      data: BASE + "/channels.json"
    }
  ]
};

fs.writeFileSync(
  path.join(dist, "menu.json"),
  JSON.stringify(menuJson, null, 2)
);

const channelsJson = {
  headline: "Тест",
  pages: [
    {
      items: [
        {
          title: "Test Stream",
          action:
            "player:play:https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        }
      ]
    }
  ]
};

fs.writeFileSync(
  path.join(dist, "channels.json"),
  JSON.stringify(channelsJson, null, 2)
);

console.log("Done");
