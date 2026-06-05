const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PLAYLIST_URL = process.env.PLAYLIST_URL || 'https://cdnua03.hls.tv/h/04C4E0987B71CEE3/hls.m3u';
const BASE = 'https://msx-iptv.vercel.app';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseM3U(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const channels = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXTINF:')) {
      current = {};
      const nameMatch = line.match(/,(.+)$/);
      current.name = nameMatch ? nameMatch[1].trim() : 'Unknown';

      const groupMatch = line.match(/group-title="([^"]*)"/);
      current.group = groupMatch ? groupMatch[1].trim() || 'Інше' : 'Інше';

      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      current.logo = logoMatch ? logoMatch[1] : '';
    } else if (line.startsWith('#')) {
      continue;
    } else if (current) {
      current.url = line;
      channels.push(current);
      current = null;
    }
  }
  return channels;
}

function buildItems(channels) {
  return channels.map(ch => {
    const item = {
      title: '',
      titleFooter: ch.name,
      titleFooterSize: 'small',
      type: 'separate',
      layout: '0,0,2,2',
      action: 'player:play:' + ch.url,
      properties: { 'resume:position': 'none' }
    };
    if (ch.logo) {
      item.image = ch.logo;
      item.imageFiller = 'width-center';
    } else {
      item.icon = 'msx-white-soft:live-tv';
      item.iconSize = 'large';
    }
    return item;
  });
}

function paginate(items, perPage) {
  const pages = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push({ items: items.slice(i, i + perPage) });
  }
  return pages.length ? pages : [{ items: [{ title: 'Порожньо' }] }];
}

function safeFilename(name) {
  return name.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9]/g, '_').toLowerCase();
}

async function main() {
  console.log('Fetching playlist...');
  const text = await fetchUrl(PLAYLIST_URL);
  const channels = parseM3U(text);
  console.log('Channels: ' + channels.length);

  const dist = path.join(__dirname, 'public');
  if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true });
  fs.mkdirSync(dist, { recursive: true });

  // Групи
  const groups = {};
  channels.forEach(ch => {
    if (!groups[ch.group]) groups[ch.group] = [];
    groups[ch.group].push(ch);
  });

  const groupList = Object.entries(groups)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([name, items]) => ({ name, count: items.length, filename: 'ch_' + safeFilename(name) + '.json' }));

  // start.json
  const startJson = {
    name: 'IPTV Ukraine',
    version: '1.0.0',
    parameter: 'menu:request:interaction:init@' + BASE + '/menu.json'
  };
  fs.writeFileSync(path.join(dist, 'start.json'), JSON.stringify(startJson, null, 2));
  fs.writeFileSync(path.join(dist, 'index.json'), JSON.stringify(startJson, null, 2));

  // menu.json
  const menuItems = [
    {
      focus: true,
      label: 'Усі канали',
      icon: 'live-tv',
      badge: String(channels.length),
      data: 'menu:request:interaction:content@' + BASE + '/ch_all.json'
    }
  ];

  if (groupList.length > 1) {
    groupList.forEach(g => {
      menuItems.push({
        label: g.name,
        badge: String(g.count),
        data: 'menu:request:interaction:content@' + BASE + '/' + g.filename
      });
    });
  }

  const menuJson = {
    response: {
      header: { title: 'IPTV Ukraine', subtitle: channels.length + ' каналів' },
      menu: { cache: true, reuse: false, scrollbar: true, items: menuItems }
    }
  };
  fs.writeFileSync(path.join(dist, 'menu.json'), JSON.stringify(menuJson, null, 2));

  // ch_all.json
  const allJson = {
    response: {
      header: { title: 'Усі канали', subtitle: channels.length + ' каналів' },
      pages: paginate(buildItems(channels), 12),
      template: { type: 'separate', layout: '0,0,2,2', color: 'msx-glass' }
    }
  };
  fs.writeFileSync(path.join(dist, 'ch_all.json'), JSON.stringify(allJson, null, 2));

  // Кожна група
  if (groupList.length > 1) {
    groupList.forEach(g => {
      const json = {
        response: {
          header: { title: g.name, subtitle: g.count + ' каналів' },
          pages: paginate(buildItems(groups[g.name]), 12),
          template: { type: 'separate', layout: '0,0,2,2', color: 'msx-glass' }
        }
      };
      fs.writeFileSync(path.join(dist, g.filename), JSON.stringify(json, null, 2));
    });
  }

  // index.html
  const indexHtml = '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=start.json"></head><body></body></html>';
  fs.writeFileSync(path.join(dist, 'index.html'), indexHtml);

  console.log('Done! Generated ' + fs.readdirSync(dist).length + ' files');
}

main().catch(err => { console.error(err); process.exit(1); });
