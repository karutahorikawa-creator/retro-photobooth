export type FilterName = 'original' | 'warm' | 'bw' | 'vintage' | 'soft';

export type MusicProvider = 'youtube' | 'spotify' | null;

export interface MemoryRecord {
  id: string;
  image_url: string;
  filter: FilterName;
  music_url: string | null;
  music_provider: MusicProvider;
  message: string | null;
  created_at: string;
}

export interface MusicInfo {
  url: string;
  provider: MusicProvider;
  embedId: string;
}

export type BoothState =
  | 'home'
  | 'requesting-permission'
  | 'permission-denied'
  | 'camera-ready'
  | 'countdown'
  | 'capturing'
  | 'between-shots'
  | 'all-captured'
  | 'printing'
  | 'strip-preview'
  | 'music-input'
  | 'message-input'
  | 'creating'
  | 'done';
