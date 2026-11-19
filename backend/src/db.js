const config = require('./config');

// In-memory / seed storage with realistic sports turf fixtures
const turfs = [
  {
    id: 'turf1',
    name: 'Apex Arena - Main Football Pitch',
    sport: 'Football 7v7',
    surface: 'FIFA Quality Pro Artificial Turf',
    location: 'Pitch A (East Complex)',
    streamPath: 'turf1',
    dimensions: '60m x 40m',
    lighting: 'LED Floodlights 500 Lux',
    ingestionType: 'RTSP Push / Pull',
    recommendedCamera: 'PoE IP Cam (4K / 30fps) or Android IP Webcam App',
    description: 'Premier floodlit 7-a-side football turf with automated sideline broadcast cameras.'
  },
  {
    id: 'turf2',
    name: 'Vanguard Futsal Cage',
    sport: 'Futsal 5v5',
    surface: 'High-Impact Polypropylene Interlocking',
    location: 'Pitch B (Central Pavilion)',
    streamPath: 'turf2',
    dimensions: '42m x 25m',
    lighting: 'Indoor High Bay LEDs',
    ingestionType: 'RTSP / RTMP / Raspberry Pi Cam 3',
    recommendedCamera: 'Raspberry Pi 5 with Pi Camera Module 3 or Sports Cam (GoPro)',
    description: 'Fast-paced indoor futsal arena with ceiling-mounted wide-angle action view.'
  },
  {
    id: 'turf3',
    name: 'Thunder Box Cricket Arena',
    sport: 'Box Cricket 8v8',
    surface: 'AstroTurf with Shockpad',
    location: 'Pitch C (North Wing)',
    streamPath: 'turf3',
    dimensions: '30m x 18m',
    lighting: 'Overhead Enclosed Arena Glow',
    ingestionType: 'RTSP Pull (Android / PoE)',
    recommendedCamera: 'Dual PoE IP Cam (Bowler end + Batsman wide)',
    description: 'Enclosed cricket netting arena featuring full pitch coverage and boundary replay.'
  }
];

// Helper to generate seed archives relative to current boot time
function generateSeedArchives() {
  const now = Date.now();
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;

  return [
    {
      id: 'rec-turf1-recent-1',
      turfId: 'turf1',
      title: 'Premier League: Blue Titans vs Red Wings',
      sport: 'Football 7v7',
      endedAt: new Date(now - 45 * MINUTE).toISOString(), // 45m ago -> within 2hr free window!
      startedAt: new Date(now - 105 * MINUTE).toISOString(),
      durationSeconds: 3600,
      score: '4 - 3',
      fileName: 'rec-turf1-recent-1.mp4',
      description: 'High-intensity second half comeback thrilling local spectators.',
      thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
      views: 312
    },
    {
      id: 'rec-turf2-recent-2',
      turfId: 'turf2',
      title: 'Futsal Derby: Strike Force vs Venom FC',
      sport: 'Futsal 5v5',
      endedAt: new Date(now - 90 * MINUTE).toISOString(), // 90m ago -> within 2hr free window!
      startedAt: new Date(now - 140 * MINUTE).toISOString(),
      durationSeconds: 3000,
      score: '5 - 5',
      fileName: 'rec-turf2-recent-2.mp4',
      description: 'Intense end-to-end tactical futsal battle ending in a draw.',
      thumbnail: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=600&q=80',
      views: 184
    },
    {
      id: 'rec-turf1-older-1',
      turfId: 'turf1',
      title: 'Morning Championship: Knights vs City FC',
      sport: 'Football 7v7',
      endedAt: new Date(now - 4 * HOUR).toISOString(), // 4h ago -> Older than 2 hours! PAYWALLED
      startedAt: new Date(now - 5 * HOUR).toISOString(),
      durationSeconds: 3600,
      score: '2 - 1',
      fileName: 'rec-turf1-older-1.mp4',
      description: 'Morning tournament quarterfinals with stunning bicycle kick winner.',
      thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
      views: 540
    },
    {
      id: 'rec-turf3-older-2',
      turfId: 'turf3',
      title: 'Box Cricket Super 8s: Thunder XI vs Stormers',
      sport: 'Box Cricket 8v8',
      endedAt: new Date(now - 7 * HOUR).toISOString(), // 7h ago -> Older than 2 hours! PAYWALLED
      startedAt: new Date(now - 8 * HOUR).toISOString(),
      durationSeconds: 3600,
      score: '112/6 (10 ov) vs 108/7',
      fileName: 'rec-turf3-older-2.mp4',
      description: 'Last-ball thriller boundary finish in tournament group stage.',
      thumbnail: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80',
      views: 420
    },
    {
      id: 'rec-turf2-older-3',
      turfId: 'turf2',
      title: 'Night Futsal League: Underdogs vs Titans',
      sport: 'Futsal 5v5',
      endedAt: new Date(now - 22 * HOUR).toISOString(), // 22h ago -> Older than 2 hours! PAYWALLED
      startedAt: new Date(now - 23 * HOUR).toISOString(),
      durationSeconds: 3600,
      score: '6 - 4',
      fileName: 'rec-turf2-older-3.mp4',
      description: 'High-scoring showdown under floodlights with tactical set pieces.',
      thumbnail: 'https://images.unsplash.com/photo-1529900241454-946a3628e93d?auto=format&fit=crop&w=600&q=80',
      views: 680
    }
  ];
}

let archives = generateSeedArchives();

module.exports = {
  getTurfs: () => turfs,
  getTurfById: (id) => turfs.find(t => t.id === id),
  getArchives: (turfId) => {
    let list = archives;
    if (turfId) {
      list = list.filter(a => a.turfId === turfId);
    }
    const now = Date.now();
    return list.map(a => {
      const endedTime = new Date(a.endedAt).getTime();
      const ageMs = now - endedTime;
      const isOlderThan2Hours = ageMs > config.paywallFreeWindowMs;
      const freeWindowExpiresAt = new Date(endedTime + config.paywallFreeWindowMs).toISOString();
      const timeRemainingMs = Math.max(0, config.paywallFreeWindowMs - ageMs);

      return {
        ...a,
        ageMinutes: Math.round(ageMs / 60000),
        isOlderThan2Hours,
        freeWindowExpiresAt,
        timeRemainingInFreeWindowMs: timeRemainingMs,
        price: 1.99,
        currency: 'USD'
      };
    });
  },
  getArchiveById: (id) => {
    const item = archives.find(a => a.id === id);
    if (!item) return null;
    const now = Date.now();
    const endedTime = new Date(item.endedAt).getTime();
    const ageMs = now - endedTime;
    const isOlderThan2Hours = ageMs > config.paywallFreeWindowMs;
    const freeWindowExpiresAt = new Date(endedTime + config.paywallFreeWindowMs).toISOString();
    const timeRemainingMs = Math.max(0, config.paywallFreeWindowMs - ageMs);

    return {
      ...item,
      ageMinutes: Math.round(ageMs / 60000),
      isOlderThan2Hours,
      freeWindowExpiresAt,
      timeRemainingInFreeWindowMs: timeRemainingMs,
      price: 1.99,
      currency: 'USD'
    };
  },
  addArchive: (session) => {
    archives.unshift(session);
    return session;
  },
  resetDemoSeed: () => {
    archives = generateSeedArchives();
    return archives;
  }
};
