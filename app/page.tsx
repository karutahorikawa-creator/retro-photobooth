import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A0F0A',
        padding: '24px 16px',
        gap: 12,
      }}
    >
      {/* The photobooth machine */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 380,
          backgroundColor: '#2C1810',
          borderRadius: '20px 20px 10px 10px',
          boxShadow: '8px 12px 0 #0D0805, inset 0 0 60px rgba(0,0,0,0.4)',
          border: '3px solid #1A0F0A',
          overflow: 'hidden',
        }}
      >
        {/* Machine top stripe */}
        <div style={{
          height: 8,
          background: 'repeating-linear-gradient(90deg, #C4372A 0px, #C4372A 20px, #2C1810 20px, #2C1810 24px)',
        }} />

        {/* Header / Sign */}
        <div
          style={{
            padding: '18px 24px 14px',
            textAlign: 'center',
            borderBottom: '2px solid #1A0F0A',
          }}
        >
          {/* Illuminated sign */}
          <div style={{
            display: 'inline-block',
            backgroundColor: '#0D0805',
            border: '2px solid #C4882A',
            borderRadius: 6,
            padding: '6px 20px',
            marginBottom: 10,
            boxShadow: '0 0 16px rgba(196, 136, 42, 0.4), inset 0 0 8px rgba(0,0,0,0.6)',
          }}>
            <span style={{
              fontFamily: '"Oswald", "Arial Narrow", sans-serif',
              fontWeight: 700,
              fontSize: 26,
              letterSpacing: '0.15em',
              color: '#C4882A',
              textShadow: '0 0 12px rgba(196, 136, 42, 0.8)',
              textTransform: 'uppercase',
            }}>
              Memory Booth
            </span>
          </div>

          {/* Subtitle label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
            <span style={{ flex: 1, height: 1, backgroundColor: '#3D2B1F', maxWidth: 40, display: 'block' }} />
            <span style={{
              fontSize: 9,
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: '#7A6A5A',
            }}>
              est. 1987 · est. 1987
            </span>
            <span style={{ flex: 1, height: 1, backgroundColor: '#3D2B1F', maxWidth: 40, display: 'block' }} />
          </div>
        </div>

        {/* Screen / Viewfinder area */}
        <div style={{
          margin: '16px 20px',
          backgroundColor: '#0D0805',
          borderRadius: 10,
          border: '3px solid #1A0F0A',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8), 0 4px 0 #0D0805',
          overflow: 'hidden',
          aspectRatio: '4/3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          position: 'relative',
        }}>
          {/* CRT scan lines */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
            pointerEvents: 'none',
            zIndex: 1,
          }} />

          {/* VACANT indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(196, 136, 42, 0.1)',
            border: '1px solid rgba(196, 136, 42, 0.3)',
            borderRadius: 4,
            padding: '6px 14px',
            zIndex: 2,
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#6B8A4E',
              boxShadow: '0 0 8px #6B8A4E',
              animation: 'blink 2s ease-in-out infinite',
              display: 'inline-block',
            }} />
            <span style={{
              fontFamily: 'monospace',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#C4882A',
            }}>
              VACANT
            </span>
          </div>

          {/* Instructions */}
          <p style={{
            fontFamily: '"Special Elite", monospace',
            fontSize: 11,
            color: '#5A4A3A',
            textAlign: 'center',
            lineHeight: 1.6,
            padding: '0 20px',
            zIndex: 2,
            margin: 0,
          }}>
            4 photos · 1 song · 1 memory<br />
            ready to be made
          </p>

          {/* Decorative mini strip */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            opacity: 0.25,
            zIndex: 2,
          }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                width: 28,
                height: 18,
                backgroundColor: '#3D2B1F',
                border: '1px solid #4D3B2F',
                borderRadius: 1,
              }} />
            ))}
          </div>
        </div>

        {/* Filter dots — decorative */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          padding: '0 0 10px',
        }}>
          {['#A8A09A', '#C4882A', '#4A4A4A', '#8B6C47', '#C47A95'].map((color, i) => (
            <span key={i} style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: color,
              opacity: 0.45,
              display: 'inline-block',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
            }} />
          ))}
        </div>

        {/* Divider label */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px 8px',
          gap: 12,
        }}>
          <span style={{ flex: 1, height: '1px', backgroundColor: '#1A0F0A', display: 'block' }} />
          <span style={{
            fontSize: 9,
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#4A3A2A',
          }}>
            ● INSERT MEMORIES ●
          </span>
          <span style={{ flex: 1, height: '1px', backgroundColor: '#1A0F0A', display: 'block' }} />
        </div>

        {/* START button */}
        <div style={{ padding: '0 24px 20px' }}>
          <Link href="/booth" style={{ display: 'block', textDecoration: 'none' }}>
            <div
              style={{
                width: '100%',
                padding: '14px 0',
                backgroundColor: '#C4372A',
                border: '3px solid #8B2820',
                borderRadius: 6,
                color: '#F5F0E8',
                fontFamily: '"Oswald", "Arial Narrow", sans-serif',
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 5px 0 #6B1810, 0 6px 12px rgba(0,0,0,0.5)',
                textAlign: 'center',
                userSelect: 'none',
              }}
            >
              ENTER BOOTH
            </div>
          </Link>
        </div>

        {/* Output slot */}
        <div style={{
          height: 20,
          backgroundColor: '#0D0805',
          borderTop: '3px solid #1A0F0A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: 80,
            height: 6,
            backgroundColor: '#050302',
            borderRadius: 1,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.9)',
          }} />
        </div>
      </div>

      {/* Label below machine */}
      <p style={{
        fontSize: 9,
        fontFamily: 'monospace',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color: '#3D2B1F',
        textAlign: 'center',
      }}>
        no coin required · no account needed
      </p>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </main>
  );
}
