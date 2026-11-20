const config = require('./config');

// In-memory / seed storage with realistic sports turf fixtures
const turfs = [
  {
    id: 'turf1',
    name: 'Greenfield Arena',
    sport: 'Football',
    category: 'football',
    surface: 'Pro FIFA Artificial Grass',
    location: 'Stern, NY',
    lat: 40.7295,
    lng: -73.9965,
    price: 19.50,
    priceFormatted: '$19.50',
    rating: 4.95,
    badge: 'Top 10',
    streamPath: 'turf1',
    dimensions: '60m x 40m',
    lighting: 'Night LED Floodlights 600 Lux',
    ingestionType: 'RTSP Push / Pull',
    recommendedCamera: 'PoE IP Cam (4K / 30fps) or Android IP Webcam App',
    description: 'Premier floodlit football turf with automated sideline broadcast cameras, pro grass, and full kit.',
    image: 'https://images.unsplash.com/photo-1529900241454-946a3628e93d?auto=format&fit=crop&w=800&q=80',
    amenities: ['First-Aid', 'Changing Room', 'Kit Provided', 'Artificial Grass', 'Free Parking', '6v6', 'Live HD Cam'],
    availableSlots: ['14:30 - 15:30', '16:00 - 17:00', '17:30 - 18:30', '20:00 - 21:00']
  },
  {
    id: 'turf-astropark',
    name: 'AstroPark Sports Hub',
    sport: 'Football',
    category: 'football',
    surface: 'Shock-Absorbing AstroTurf',
    location: 'Broome, NY',
    lat: 40.7205,
    lng: -73.9940,
    price: 14.90,
    priceFormatted: '$14.90',
    rating: 4.85,
    badge: 'Grounds Near You',
    streamPath: 'turf1',
    dimensions: '55m x 35m',
    lighting: 'Stadium Spec LEDs',
    ingestionType: 'RTSP / RTMP / Sports Cam',
    recommendedCamera: 'GoPro Hero / Android IP Webcam',
    description: 'Downtown pitch with high-performance turf, crisp sidelines, and multi-angle match coverage.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    amenities: ['First-Aid', 'Changing Room', 'Artificial Grass', 'Free Parking', '7v7', 'Live Cam'],
    availableSlots: ['15:00 - 16:00', '16:30 - 17:30', '18:00 - 19:00', '21:00 - 22:00']
  },
  {
    id: 'turf-apex',
    name: 'Apex Arena - Main Football Pitch',
    sport: 'Football',
    category: 'football',
    surface: 'FIFA Quality Pro Artificial Turf',
    location: 'Pitch A (East Complex)',
    lat: 40.7410,
    lng: -73.9780,
    price: 18.00,
    priceFormatted: '$18.00',
    rating: 4.9,
    badge: 'Featured Live',
    streamPath: 'turf1',
    dimensions: '60m x 40m',
    lighting: 'LED Floodlights 500 Lux',
    ingestionType: 'RTSP Push / Pull',
    recommendedCamera: 'PoE IP Cam (4K / 30fps) or Android IP Webcam App',
    description: 'Championship-grade floodlit 7-a-side football turf with automated sideline broadcast cameras.',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    amenities: ['First-Aid', 'Changing Room', 'Night Floodlights', 'Artificial Grass', 'Free Parking', '7v7', 'Live Cam'],
    availableSlots: ['14:00 - 15:00', '16:00 - 17:00', '18:00 - 19:00', '20:00 - 21:00']
  },
  {
    id: 'turf2',
    name: 'Vanguard Futsal Cage',
    sport: 'Futsal',
    category: 'futsal',
    surface: 'High-Impact Polypropylene Interlocking',
    location: 'Pitch B (Central Pavilion)',
    lat: 40.7512,
    lng: -73.9930,
    price: 16.50,
    priceFormatted: '$16.50',
    rating: 4.8,
    badge: 'Fast Futsal',
    streamPath: 'turf2',
    dimensions: '42m x 25m',
    lighting: 'Indoor High Bay LEDs',
    ingestionType: 'RTSP / RTMP / Raspberry Pi Cam 3',
    recommendedCamera: 'Raspberry Pi 5 with Pi Camera Module 3 or Sports Cam (GoPro)',
    description: 'Fast-paced indoor futsal arena with ceiling-mounted wide-angle action view.',
    image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80',
    amenities: ['Air Conditioned', 'Locker Room', 'Scoreboard', 'Interlocking Floor', '5v5', 'Live HD Cam'],
    availableSlots: ['13:00 - 14:00', '15:30 - 16:30', '17:00 - 18:00', '19:30 - 20:30']
  },
  {
    id: 'turf3',
    name: 'Thunder Box Cricket Arena',
    sport: 'Cricket',
    category: 'cricket',
    surface: 'AstroTurf with Shockpad',
    location: 'Pitch C (North Wing)',
    lat: 40.7620,
    lng: -73.9810,
    price: 15.00,
    priceFormatted: '$15.00',
    rating: 4.7,
    badge: 'Super 8s',
    streamPath: 'turf3',
    dimensions: '30m x 18m',
    lighting: 'Overhead Enclosed Arena Glow',
    ingestionType: 'RTSP Pull (Android / PoE)',
    recommendedCamera: 'Dual PoE IP Cam (Bowler end + Batsman wide)',
    description: 'Enclosed cricket netting arena featuring full pitch coverage and boundary replay.',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
    amenities: ['Enclosed Netting', 'Kit Provided', 'Shockpad Turf', 'Night Floodlights', '8v8', 'Live HD Cam'],
    availableSlots: ['14:30 - 15:30', '16:00 - 17:00', '18:30 - 19:30', '20:30 - 21:30']
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
        requiredForReplay: isOlderThan2Hours,
        requiredForDownload: true
      };
    });
  },
  getArchiveById: (id) => {
    const a = archives.find(x => x.id === id);
    if (!a) return null;
    const now = Date.now();
    const endedTime = new Date(a.endedAt).getTime();
    const ageMs = now - endedTime;
    const isOlderThan2Hours = ageMs > config.paywallFreeWindowMs;

    return {
      ...a,
      ageMinutes: Math.round(ageMs / 60000),
      isOlderThan2Hours,
      price: 1.99
    };
  },
  resetDemoSeed: () => {
    archives = generateSeedArchives();
    return archives;
  }
};
