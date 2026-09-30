import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#1A0F0A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 16,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'monospace',
        fontSize: 48,
        color: '#3D2B1F',
        lineHeight: 1,
      }}>
        ⊘
      </div>
      <p style={{
        fontFamily: '"Special Elite", serif',
        fontSize: 16,
        color: '#7A6A5A',
        lineHeight: 1.7,
      }}>
        This memory couldn't be found.<br />
        It may have never existed.
      </p>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontFamily: '"Special Elite", serif',
          fontSize: 12,
          color: '#C4372A',
          letterSpacing: '0.1em',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
        }}>
          return to the booth
        </span>
      </Link>
    </main>
  );
}
