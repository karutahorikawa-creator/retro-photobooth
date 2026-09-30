'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import FlipStrip from '@/components/share/FlipStrip';
import MusicPlayer, { type MusicPlayerHandle } from '@/components/share/MusicPlayer';
import { detectMusicProvider } from '@/lib/music-detector';
import type { MemoryRecord } from '@/types';

interface Props {
  memory: MemoryRecord;
}

export default function SharePageClient({ memory }: Props) {
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const musicPlayerRef = useRef<MusicPlayerHandle>(null);

  const musicInfo = memory.music_url ? detectMusicProvider(memory.music_url) : null;
  const hasMusic = !!musicInfo && musicInfo.provider !== null;
  const isYouTube = musicInfo?.provider === 'youtube';
  const isSpotify = musicInfo?.provider === 'spotify';

  function toggleMusic() {
    if (!hasMusic) return;
    if (isYouTube) {
      // Call synchronously in the click handler — preserves Safari's user-gesture chain.
      // playing state is updated reactively via onPlayStateChange (from YT's onStateChange).
      // If the player isn't ready yet, toggle() is a no-op and the strip retains "tap to play".
      musicPlayerRef.current?.toggle();
    } else {
      setPlaying(p => !p);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/p/${memory.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: 'A memory for you ♡' });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled share or clipboard failed
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // noop
      }
    }
  }

  const formattedDate = new Date(memory.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#1A0F0A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      gap: 20,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: '"Oswald", sans-serif',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.2em',
            color: '#3D2B1F',
            textTransform: 'uppercase',
          }}>
            Memory Booth
          </span>
        </Link>
        <p style={{
          fontFamily: '"Special Elite", serif',
          fontSize: 11,
          color: '#5A4A3A',
          marginTop: 4,
          letterSpacing: '0.05em',
        }}>
          {formattedDate}
        </p>
      </div>

      {/* Photo strip + flip */}
      <FlipStrip
        imageUrl={memory.image_url}
        message={memory.message}
        hasMusic={isYouTube} // only YouTube supports click-to-play
        playing={playing}
        onToggleMusic={toggleMusic}
      />

      {/* Spotify player shown inline (can't hide/control it easily) */}
      {isSpotify && musicInfo && (
        <div style={{ width: '100%', maxWidth: 288 }}>
          <p style={{
            fontFamily: '"Special Elite", serif',
            fontSize: 11,
            color: '#7A6A5A',
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: '0.05em',
          }}>
            ♫ attached song
          </p>
          <MusicPlayer
            provider={musicInfo.provider}
            embedId={musicInfo.embedId}
            playing={playing}
            onPlayStateChange={setPlaying}
          />
        </div>
      )}

      {/* YouTube player — MusicPlayer positions itself off-screen via position:fixed */}
      {isYouTube && musicInfo && (
        <MusicPlayer
          ref={musicPlayerRef}
          provider={musicInfo.provider}
          embedId={musicInfo.embedId}
          playing={playing}
          onPlayStateChange={setPlaying}
        />
      )}

      {/* Share button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleShare}
          style={{
            padding: '10px 24px',
            backgroundColor: 'transparent',
            border: '1.5px solid #3D2B1F',
            borderRadius: 4,
            color: copied ? '#6B8A4E' : '#8A7A6A',
            fontFamily: '"Special Elite", serif',
            fontSize: 12,
            cursor: 'pointer',
            letterSpacing: '0.1em',
            transition: 'color 0.2s, border-color 0.2s',
          }}
        >
          {copied ? 'link copied ✓' : 'copy link ↗'}
        </button>

        <Link href="/booth" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: '"Special Elite", serif',
            fontSize: 10,
            color: '#3D2B1F',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
          }}>
            make your own memory
          </span>
        </Link>
      </div>
    </main>
  );
}
