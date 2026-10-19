/**
 * Illustrative images generated as inline SVG, so the gallery works offline
 * and ships no binary assets. Each scene is a simple landscape.
 */
const SCENES = [
  { title: 'Hunza Valley at dawn', place: 'Gilgit-Baltistan', sky: ['#f6c58a', '#e9866b'], hills: ['#5d6f8f', '#3f4f6e', '#26324a'], sun: '#fff1c9' },
  { title: 'Clifton beach evening', place: 'Karachi', sky: ['#7fb3d8', '#f2a97e'], hills: ['#2e6690', '#235071', '#19354b'], sun: '#ffe2b0', sea: true },
  { title: 'Margalla Hills trail', place: 'Islamabad', sky: ['#b9e2d3', '#7ed0b4'], hills: ['#48b594', '#187f65', '#114339'], sun: '#ffffff' },
  { title: 'Deosai plains', place: 'Skardu', sky: ['#cfd9f2', '#9db3e0'], hills: ['#8b6fd6', '#5f4cae', '#3c2f78'], sun: '#fdf7e7' },
  { title: 'Thar desert dunes', place: 'Sindh', sky: ['#fde3a7', '#f3b562'], hills: ['#dda92c', '#c4901d', '#7c5a12'], sun: '#fff8e1' },
  { title: 'Lake Saiful Muluk', place: 'Naran', sky: ['#a7d3e8', '#5390c0'], hills: ['#3e9fb0', '#2b7381', '#174a54'], sun: '#ffffff', sea: true },
  { title: 'Fairy Meadows night', place: 'Nanga Parbat', sky: ['#1e1b4b', '#3b3a7a'], hills: ['#2d3b5c', '#1d2944', '#111a2e'], sun: '#f4f1d0', night: true },
  { title: 'Swat river bend', place: 'Khyber Pakhtunkhwa', sky: ['#d9f0e4', '#a4e5c3'], hills: ['#3eb981', '#16814d', '#0c452b'], sun: '#fffbe6', sea: true },
  { title: 'Lahore Fort sunset', place: 'Punjab', sky: ['#f7b2a0', '#d0504c'], hills: ['#8f2e2c', '#5f201f', '#3a1413'], sun: '#ffe0c2' },
];

function svg({ sky, hills, sun, sea, night }, w, h) {
  const stars = night ? Array.from({ length: 24 }, (_, i) => `<circle cx="${(i * 97) % w}" cy="${(i * 53) % (h * 0.45)}" r="${i % 3 ? 1 : 1.6}" fill="#fff" opacity="0.8"/>`).join('') : '';
  const water = sea ? `<rect y="${h * 0.78}" width="${w}" height="${h * 0.22}" fill="${hills[0]}" opacity="0.55"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#s)"/>${stars}
<circle cx="${w * 0.72}" cy="${h * 0.32}" r="${h * 0.11}" fill="${sun}" opacity="0.95"/>
<path d="M0 ${h * 0.62} L${w * 0.18} ${h * 0.38} L${w * 0.34} ${h * 0.55} L${w * 0.5} ${h * 0.3} L${w * 0.7} ${h * 0.52} L${w * 0.86} ${h * 0.4} L${w} ${h * 0.56} V${h} H0Z" fill="${hills[0]}"/>
<path d="M0 ${h * 0.74} Q${w * 0.25} ${h * 0.56} ${w * 0.5} ${h * 0.7} T${w} ${h * 0.66} V${h} H0Z" fill="${hills[1]}"/>
<path d="M0 ${h * 0.88} Q${w * 0.3} ${h * 0.76} ${w * 0.62} ${h * 0.86} T${w} ${h * 0.82} V${h} H0Z" fill="${hills[2]}"/>${water}
</svg>`;
}

export function sceneImage(index = 0, w = 640, h = 420) {
  const scene = SCENES[((index % SCENES.length) + SCENES.length) % SCENES.length];
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg(scene, w, h))}`;
}

export const GALLERY = SCENES.map((s, i) => ({
  id: i,
  title: s.title,
  place: s.place,
  src: sceneImage(i, 1280, 840),
  thumb: sceneImage(i, 320, 210),
}));
