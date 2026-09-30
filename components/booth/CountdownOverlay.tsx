'use client';

import { useEffect, useState } from 'react';

interface Props {
  from?: number;
  onComplete(): void;
}

export default function CountdownOverlay({ from = 3, onComplete }: Props) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount(c => c - 1), 900);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        zIndex: 10,
      }}
    >
      <span
        key={count}
        style={{
          fontSize: count > 0 ? 96 : 72,
          fontWeight: 700,
          color: '#F5F0E8',
          fontFamily: '"Special Elite", "Courier New", monospace',
          textShadow: '0 0 30px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.6)',
          animation: 'countPop 0.35s ease-out',
          lineHeight: 1,
        }}
      >
        {count > 0 ? count : '✦'}
      </span>
      <style>{`
        @keyframes countPop {
          0% { transform: scale(1.6); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
