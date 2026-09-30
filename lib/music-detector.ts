import type { MusicInfo, MusicProvider } from '@/types';

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
];

const SPOTIFY_PATTERNS = [
  /open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/,
];

function extractYouTubeId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractSpotifyId(url: string): { type: string; id: string } | null {
  for (const pattern of SPOTIFY_PATTERNS) {
    const match = url.match(pattern);
    if (match) return { type: match[1], id: match[2] };
  }
  return null;
}

export function detectMusicProvider(url: string): MusicInfo | null {
  if (!url.trim()) return null;

  const ytId = extractYouTubeId(url);
  if (ytId) {
    return { url, provider: 'youtube', embedId: ytId };
  }

  const spotifyInfo = extractSpotifyId(url);
  if (spotifyInfo) {
    return { url, provider: 'spotify', embedId: `${spotifyInfo.type}/${spotifyInfo.id}` };
  }

  return null;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&autoplay=0&controls=0&rel=0&modestbranding=1`;
}

export function getSpotifyEmbedUrl(embedId: string): string {
  return `https://open.spotify.com/embed/${embedId}?utm_source=generator&theme=0`;
}

export function validateMusicUrl(url: string): { valid: boolean; error?: string } {
  if (!url.trim()) return { valid: false, error: 'Please paste a music URL.' };

  try {
    new URL(url);
  } catch {
    return { valid: false, error: 'That doesn\'t look like a valid URL.' };
  }

  const info = detectMusicProvider(url);
  if (!info) {
    return {
      valid: false,
      error: 'Only YouTube and Spotify links are supported right now.',
    };
  }

  return { valid: true };
}
