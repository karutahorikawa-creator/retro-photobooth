'use client';

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { getYouTubeEmbedUrl, getSpotifyEmbedUrl } from '@/lib/music-detector';
import type { MusicProvider } from '@/types';

interface Props {
  provider: MusicProvider;
  embedId: string;
  playing: boolean;
  onPlayStateChange(playing: boolean): void;
}

export interface MusicPlayerHandle {
  /** Synchronous toggle — call directly from a click handler to preserve Safari's user-gesture chain */
  toggle: () => void;
  isReady: () => boolean;
}

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement | string, opts: object) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  getPlayerState(): number;
  destroy(): void;
}

const MusicPlayer = forwardRef<MusicPlayerHandle, Props>(
  function MusicPlayer({ provider, embedId, playing, onPlayStateChange }, ref) {
    // Container div that the YT IFrame API injects its iframe into.
    // A real div (not a 0×0 iframe placeholder) avoids React reconciliation hazards.
    const containerRef = useRef<HTMLDivElement>(null);
    const ytPlayerRef = useRef<YTPlayer | null>(null);
    const [ytReady, setYtReady] = useState(false);

    // Expose synchronous toggle so the share page can call playVideo/pauseVideo
    // in the same call stack as the user's click event (required by Safari).
    useImperativeHandle(ref, () => ({
      toggle() {
        if (!ytPlayerRef.current || !ytReady) return;
        try {
          const state = ytPlayerRef.current.getPlayerState();
          if (state === window.YT.PlayerState.PLAYING) {
            ytPlayerRef.current.pauseVideo();
          } else {
            ytPlayerRef.current.playVideo();
          }
        } catch { /* noop */ }
      },
      isReady() {
        return ytReady;
      },
    }), [ytReady]);

    const initYouTube = useCallback(() => {
      if (ytPlayerRef.current || !containerRef.current) return;

      // Create a child div for the YT API to replace with its iframe.
      // The API replaces its target element entirely; using a child (not containerRef
      // itself) prevents a React reconciliation crash when React later tries to
      // remove a fiber node that the API has already swapped out of the DOM.
      const ytTarget = document.createElement('div');
      ytTarget.style.width = '1px';
      ytTarget.style.height = '1px';
      containerRef.current.appendChild(ytTarget);

      ytPlayerRef.current = new window.YT.Player(ytTarget, {
        videoId: embedId,
        // Non-zero dimensions are required — a 0×0 iframe is not loaded by browsers
        // and onReady never fires. We use 1×1; the wrapper keeps it off-screen.
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin, // safe: only called client-side in useEffect
        },
        events: {
          onReady: () => setYtReady(true),
          onStateChange: (event: { data: number }) => {
            const { PLAYING, PAUSED, ENDED } = window.YT.PlayerState;
            if (event.data === PLAYING) onPlayStateChange(true);
            if (event.data === PAUSED || event.data === ENDED) onPlayStateChange(false);
          },
        },
      });
    }, [embedId, onPlayStateChange]);

    useEffect(() => {
      if (provider !== 'youtube') return;

      if (window.YT?.Player) {
        initYouTube();
        return;
      }

      if (!document.getElementById('yt-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        initYouTube();
      };
    }, [provider, initYouTube]);

    // State-driven play/pause — keeps the booth's music-preview flow working.
    // On the share page this fires as a harmless no-op because the player is
    // already in the requested state (driven by the synchronous toggle() call).
    useEffect(() => {
      if (provider !== 'youtube' || !ytReady || !ytPlayerRef.current) return;
      try {
        if (playing) {
          ytPlayerRef.current.playVideo();
        } else {
          ytPlayerRef.current.pauseVideo();
        }
      } catch { /* noop */ }
    }, [playing, ytReady, provider]);

    useEffect(() => {
      return () => {
        try { ytPlayerRef.current?.destroy(); } catch { /* noop */ }
      };
    }, []);

    if (provider === 'spotify') {
      return (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <iframe
            src={getSpotifyEmbedUrl(embedId)}
            width="100%"
            height="80"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ borderRadius: 8, border: 'none' }}
            title="Spotify player"
          />
        </div>
      );
    }

    if (provider === 'youtube') {
      // Off-screen but NOT display:none / visibility:hidden / 0×0 / overflow:hidden.
      // The iframe must have real dimensions so the browser loads it and onReady fires.
      // position:fixed escapes any overflow:hidden ancestor (e.g. the booth wrapper div).
      return (
        <div
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '1px',
            height: '1px',
            pointerEvents: 'none',
          }}
        >
          <div ref={containerRef} />
        </div>
      );
    }

    return null;
  }
);

export default MusicPlayer;
