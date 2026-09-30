'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CameraView, { type CameraHandle } from '@/components/booth/CameraView';
import FilterSelector from '@/components/booth/FilterSelector';
import CountdownOverlay from '@/components/booth/CountdownOverlay';
import FlashOverlay from '@/components/booth/FlashOverlay';
import MessageInput from '@/components/booth/MessageInput';
import MusicPlayer from '@/components/share/MusicPlayer';
import { generatePhotoStrip } from '@/lib/strip-generator';
import { detectMusicProvider, validateMusicUrl } from '@/lib/music-detector';
import type { BoothState, FilterName } from '@/types';

const TOTAL_PHOTOS = 4;
const BETWEEN_SHOT_DELAY = 1200;

export default function BoothPage() {
  const router = useRouter();
  const cameraRef = useRef<CameraHandle>(null);

  const [state, setState] = useState<BoothState>('requesting-permission');
  const [filter, setFilter] = useState<FilterName>('original');
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentShot, setCurrentShot] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  const [stripBlob, setStripBlob] = useState<Blob | null>(null);
  const [stripPreviewUrl, setStripPreviewUrl] = useState<string | null>(null);
  const [musicUrl, setMusicUrl] = useState('');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicTouched, setMusicTouched] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Derived — cheap regex, no useMemo needed
  const boothMusicInfo = musicUrl.trim() ? detectMusicProvider(musicUrl) : null;
  const musicValidation = musicTouched && musicUrl.trim()
    ? validateMusicUrl(musicUrl)
    : { valid: true as const };

  // Printing animation state
  const [printProgress, setPrintProgress] = useState(0);

  const handleCameraReady = useCallback(() => {
    setState(s => s === 'requesting-permission' ? 'camera-ready' : s);
  }, []);

  const handleCameraError = useCallback((msg: string) => {
    setError(msg);
    setState('permission-denied');
  }, []);

  function startSession() {
    setPhotos([]);
    setCurrentShot(0);
    setState('countdown');
  }

  const capturePhoto = useCallback(() => {
    const dataUrl = cameraRef.current?.capturePhoto() ?? '';
    setPhotos(prev => {
      const updated = [...prev, dataUrl];
      if (updated.length >= TOTAL_PHOTOS) {
        setState('all-captured');
      } else {
        setState('between-shots');
        setShowFlash(true);
      }
      return updated;
    });
    setCurrentShot(prev => prev + 1);
  }, []);

  function handleCountdownComplete() {
    setState('capturing');
  }

  useEffect(() => {
    if (state === 'capturing') {
      capturePhoto();
    }
  }, [state, capturePhoto]);

  function handleFlashDone() {
    setShowFlash(false);
    // Start next countdown after brief pause
    setTimeout(() => {
      setState('countdown');
    }, BETWEEN_SHOT_DELAY);
  }

  // Generate strip when all photos captured
  useEffect(() => {
    if (state !== 'all-captured' || photos.length < TOTAL_PHOTOS) return;

    async function buildStrip() {
      try {
        const blob = await generatePhotoStrip(photos, filter);
        const url = URL.createObjectURL(blob);
        setStripBlob(blob);
        setStripPreviewUrl(url);
        setState('printing');
      } catch (err) {
        console.error('Strip generation failed:', err);
        setError('Failed to generate photo strip. Please try again.');
        setState('camera-ready');
      }
    }

    buildStrip();
  }, [state, photos, filter]);

  // Printing animation
  useEffect(() => {
    if (state !== 'printing') return;
    setPrintProgress(0);
    const duration = 2200;
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setPrintProgress(progress);

      if (progress >= 1) {
        clearInterval(interval);
        setTimeout(() => setState('strip-preview'), 300);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [state]);

  function handleRetake() {
    if (stripPreviewUrl) URL.revokeObjectURL(stripPreviewUrl);
    setStripPreviewUrl(null);
    setStripBlob(null);
    setPhotos([]);
    setCurrentShot(0);
    setMusicUrl('');
    setMusicPlaying(false);
    setMusicTouched(false);
    setState('camera-ready');
  }

  function handleKeep() {
    setState('music-input');
  }

  function handleMusicConfirm(url: string) {
    setMusicPlaying(false);
    setMusicUrl(url);
    setState('message-input');
  }

  function handleMusicSkip() {
    setMusicPlaying(false);
    setMusicUrl('');
    setState('message-input');
  }

  function handleMusicNext() {
    setMusicTouched(true);
    if (!musicUrl.trim()) { handleMusicSkip(); return; }
    const v = validateMusicUrl(musicUrl);
    if (!v.valid) return;
    handleMusicConfirm(musicUrl);
  }

  async function handleCreateMemory() {
    if (!stripBlob) return;
    setIsCreating(true);
    setError(null);

    try {
      const musicInfo = musicUrl.trim() ? detectMusicProvider(musicUrl) : null;

      const formData = new FormData();
      formData.append('image', new File([stripBlob], 'strip.jpg', { type: 'image/jpeg' }));
      formData.append('filter', filter);
      if (musicInfo) {
        formData.append('musicUrl', musicInfo.url);
        formData.append('musicProvider', musicInfo.provider ?? '');
      }
      if (message.trim()) {
        formData.append('message', message.trim());
      }

      const res = await fetch('/api/create', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create memory.');
      }

      // Stop camera before navigating
      cameraRef.current?.stopCamera();
      router.push(`/p/${data.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
      setIsCreating(false);
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stripPreviewUrl) URL.revokeObjectURL(stripPreviewUrl);
      cameraRef.current?.stopCamera();
    };
  }, []);

  const CAMERA_STATES: BoothState[] = ['camera-ready', 'countdown', 'capturing', 'between-shots'];
  const isCameraActive = CAMERA_STATES.includes(state);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1A0F0A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}>

        {/* Machine header */}
        <div style={{
          backgroundColor: '#2C1810',
          borderRadius: '16px 16px 0 0',
          border: '3px solid #1A0F0A',
          borderBottom: 'none',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#5A4A3A',
              fontFamily: 'monospace',
              fontSize: 11,
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            ← EXIT
          </button>
          <span style={{
            fontFamily: '"Oswald", sans-serif',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.2em',
            color: '#C4882A',
            textTransform: 'uppercase',
          }}>
            Memory Booth
          </span>
          <span style={{
            fontSize: 10,
            fontFamily: 'monospace',
            color: '#5A4A3A',
            letterSpacing: '0.1em',
          }}>
            {state === 'camera-ready' || isCameraActive
              ? `${photos.length} / ${TOTAL_PHOTOS}`
              : state === 'strip-preview' || state === 'printing'
              ? '✓ DONE'
              : '●'}
          </span>
        </div>

        {/* Main screen */}
        <div style={{
          backgroundColor: '#1A0F0A',
          border: '3px solid #1A0F0A',
          borderTop: 'none',
          borderBottom: 'none',
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* ── PERMISSION DENIED ── */}
          {state === 'permission-denied' && (
            <BoothPanel>
              <div style={{ textAlign: 'center', padding: '40px 24px', gap: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 40 }}>⊘</div>
                <p style={{ fontFamily: '"Special Elite", serif', fontSize: 14, color: '#F5F0E8', lineHeight: 1.7 }}>
                  Camera access is required<br />to use this booth.
                </p>
                <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#7A6A5A', lineHeight: 1.6 }}>
                  {error}
                </p>
                <button
                  onClick={() => { setError(null); setState('requesting-permission'); }}
                  style={buttonStyle('#C4372A')}
                >
                  Try Again
                </button>
              </div>
            </BoothPanel>
          )}

          {/* ── CAMERA / COUNTDOWN / CAPTURING ── */}
          {(state === 'requesting-permission' || isCameraActive) && (
            <div>
              {/* Camera viewport */}
              <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '4/3',
                backgroundColor: '#0D0805',
                overflow: 'hidden',
              }}>
                <CameraView
                  ref={cameraRef}
                  filter={filter}
                  onReady={handleCameraReady}
                  onError={handleCameraError}
                />

                {/* Countdown overlay */}
                {state === 'countdown' && (
                  <CountdownOverlay onComplete={handleCountdownComplete} />
                )}

                {/* Flash */}
                {showFlash && <FlashOverlay onDone={handleFlashDone} />}

                {/* Shot counter overlay */}
                {(state === 'countdown' || state === 'capturing') && photos.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 12,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: '#F5F0E8',
                    letterSpacing: '0.1em',
                    zIndex: 5,
                  }}>
                    {photos.length} / {TOTAL_PHOTOS}
                  </div>
                )}

                {/* Ready state hint */}
                {state === 'requesting-permission' && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(13,8,5,0.7)',
                    zIndex: 5,
                  }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: '#7A6A5A',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                    }}>
                      Requesting camera...
                    </span>
                  </div>
                )}
              </div>

              {/* Controls below camera */}
              {state === 'camera-ready' && (
                <div style={{
                  backgroundColor: '#221510',
                  padding: '14px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  <FilterSelector selected={filter} onChange={setFilter} />
                  <button onClick={startSession} style={buttonStyle('#C4372A')}>
                    TAKE PHOTOS
                  </button>
                </div>
              )}

              {(state === 'countdown' || state === 'capturing') && (
                <div style={{
                  backgroundColor: '#221510',
                  padding: '10px 20px',
                  textAlign: 'center',
                }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    color: '#5A4A3A',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                  }}>
                    smile! {TOTAL_PHOTOS - photos.length} more to go
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── PRINTING ANIMATION ── */}
          {state === 'printing' && stripPreviewUrl && (
            <BoothPanel>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 20px 10px',
                gap: 12,
              }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  color: '#7A6A5A',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  animation: 'fadePulse 1s ease-in-out infinite',
                }}>
                  ▓▓▓ printing...
                </span>

                {/* Output slot */}
                <div style={{
                  position: 'relative',
                  width: 90,
                  overflow: 'hidden',
                }}>
                  {/* Slot frame */}
                  <div style={{
                    position: 'relative',
                    height: 16,
                    backgroundColor: '#0D0805',
                    border: '2px solid #1A0F0A',
                    borderRadius: '4px 4px 0 0',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 60,
                      height: 6,
                      backgroundColor: '#050302',
                      borderRadius: 1,
                    }} />
                  </div>

                  {/* Emerging strip */}
                  <div style={{
                    position: 'relative',
                    overflow: 'hidden',
                    height: `${Math.round(240 * printProgress)}px`,
                    transition: 'height 0.1s',
                  }}>
                    <img
                      src={stripPreviewUrl}
                      alt="Printing strip"
                      style={{
                        width: 86,
                        display: 'block',
                        marginTop: 0,
                      }}
                    />
                  </div>
                </div>
              </div>
            </BoothPanel>
          )}

          {/* ── STRIP PREVIEW ── */}
          {state === 'strip-preview' && stripPreviewUrl && (
            <BoothPanel>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px',
                gap: 16,
              }}>
                <img
                  src={stripPreviewUrl}
                  alt="Photo strip preview"
                  style={{
                    width: '100%',
                    maxWidth: 220,
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                  }}
                />
                <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                  <button onClick={handleRetake} style={buttonStyle('#3D2B1F')}>
                    RETAKE
                  </button>
                  <button onClick={handleKeep} style={buttonStyle('#6B8A4E')}>
                    KEEP IT ♡
                  </button>
                </div>
              </div>
            </BoothPanel>
          )}

          {/* ── MUSIC INPUT ── */}
          {state === 'music-input' && (
            <BoothPanel>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Strip as primary object */}
                {stripPreviewUrl && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div
                      onClick={() => boothMusicInfo?.provider === 'youtube' && setMusicPlaying(p => !p)}
                      style={{
                        cursor: boothMusicInfo?.provider === 'youtube' ? 'pointer' : 'default',
                        position: 'relative',
                        display: 'inline-block',
                        userSelect: 'none',
                      }}
                    >
                      <img
                        src={stripPreviewUrl}
                        alt="your photo strip"
                        style={{ width: 120, borderRadius: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.7)', display: 'block' }}
                      />
                      {boothMusicInfo?.provider === 'youtube' && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: musicPlaying ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.48)',
                          borderRadius: 2,
                          transition: 'background 0.2s',
                        }}>
                          <span style={{ fontSize: 24, color: '#F5F0E8', lineHeight: 1 }}>
                            {musicPlaying ? '⏸' : '▶'}
                          </span>
                        </div>
                      )}
                    </div>
                    {boothMusicInfo?.provider === 'youtube' && (
                      <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#7A6A5A', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        {musicPlaying ? 'playing ♫ — tap to pause' : 'tap photo to test ♫'}
                      </span>
                    )}
                    {boothMusicInfo?.provider === 'spotify' && (
                      <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#7A6A5A', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        press play below to preview ♫
                      </span>
                    )}
                  </div>
                )}

                {/* YouTube: invisible player, controlled by strip tap */}
                {boothMusicInfo?.provider === 'youtube' && (
                  <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
                    <MusicPlayer
                      key={boothMusicInfo.embedId}
                      provider="youtube"
                      embedId={boothMusicInfo.embedId}
                      playing={musicPlaying}
                      onPlayStateChange={setMusicPlaying}
                    />
                  </div>
                )}

                {/* Spotify: compact visible embed */}
                {boothMusicInfo?.provider === 'spotify' && (
                  <MusicPlayer
                    key={boothMusicInfo.embedId}
                    provider="spotify"
                    embedId={boothMusicInfo.embedId}
                    playing={false}
                    onPlayStateChange={() => {}}
                  />
                )}

                {/* Heading */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 15, color: '#C4882A', fontFamily: '"Oswald", sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>
                    ADD A SONG ♫
                  </p>
                  <p style={{ fontSize: 10, color: '#5A4A3A', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '3px 0 0' }}>
                    YouTube or Spotify
                  </p>
                </div>

                {/* URL input */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="url"
                    placeholder="Paste a YouTube or Spotify link..."
                    value={musicUrl}
                    onChange={e => { setMusicUrl(e.target.value); setMusicPlaying(false); setMusicTouched(false); }}
                    onBlur={() => musicUrl && setMusicTouched(true)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#0D0805',
                      border: `1.5px solid ${!musicValidation.valid ? '#C4372A' : boothMusicInfo ? '#6B8A4E' : '#3D2B1F'}`,
                      borderRadius: 4,
                      color: '#F5F0E8',
                      fontFamily: '"Special Elite", "Courier New", monospace',
                      fontSize: 12,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {boothMusicInfo && (
                    <span style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 10,
                      color: '#6B8A4E',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      pointerEvents: 'none',
                    }}>
                      {boothMusicInfo.provider} ✓
                    </span>
                  )}
                </div>

                {!musicValidation.valid && (
                  <p style={{ fontSize: 11, color: '#C4372A', fontFamily: 'monospace', textAlign: 'center', margin: '-4px 0 0' }}>
                    {'error' in musicValidation ? musicValidation.error : ''}
                  </p>
                )}

                {/* Skip / Continue */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleMusicSkip}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      backgroundColor: 'transparent',
                      border: '1.5px solid #3D2B1F',
                      borderRadius: 4,
                      color: '#7A6A5A',
                      fontFamily: '"Special Elite", serif',
                      fontSize: 13,
                      cursor: 'pointer',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Skip ↩
                  </button>
                  <button
                    onClick={handleMusicNext}
                    style={{
                      flex: 2,
                      padding: '10px 0',
                      backgroundColor: '#C4372A',
                      border: 'none',
                      borderRadius: 4,
                      color: '#F5F0E8',
                      fontFamily: '"Special Elite", serif',
                      fontSize: 13,
                      cursor: 'pointer',
                      letterSpacing: '0.05em',
                      fontWeight: 700,
                    }}
                  >
                    Continue ♩
                  </button>
                </div>

              </div>
            </BoothPanel>
          )}

          {/* ── MESSAGE INPUT ── */}
          {state === 'message-input' && (
            <BoothPanel>
              <div style={{ padding: '20px' }}>
                <MessageInput
                  value={message}
                  onChange={setMessage}
                  onBack={() => setState('music-input')}
                  onConfirm={handleCreateMemory}
                />
                {isCreating && (
                  <p style={{
                    textAlign: 'center',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: '#7A6A5A',
                    letterSpacing: '0.1em',
                    marginTop: 10,
                    animation: 'fadePulse 1s infinite',
                  }}>
                    DEVELOPING YOUR MEMORY...
                  </p>
                )}
                {error && !isCreating && (
                  <p style={{
                    textAlign: 'center',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: '#C4372A',
                    marginTop: 8,
                  }}>
                    {error}
                  </p>
                )}
              </div>
            </BoothPanel>
          )}
        </div>

        {/* Bottom output slot */}
        <div style={{
          backgroundColor: '#2C1810',
          borderRadius: '0 0 12px 12px',
          border: '3px solid #1A0F0A',
          borderTop: 'none',
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: 70,
            height: 8,
            backgroundColor: '#0D0805',
            borderRadius: 1,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.9)',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes fadePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function BoothPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: '#221510',
      minHeight: 280,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {children}
    </div>
  );
}

function buttonStyle(bg: string): React.CSSProperties {
  return {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: bg,
    border: 'none',
    borderRadius: 4,
    color: '#F5F0E8',
    fontFamily: '"Oswald", sans-serif',
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: '0 3px 0 rgba(0,0,0,0.4)',
  };
}
