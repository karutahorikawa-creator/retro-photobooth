'use client';

import { useEffect, useState } from 'react';

interface Props {
  onDone(): void;
}

export default function FlashOverlay({ onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 100);
    }, 180);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'white',
        opacity: visible ? 0.95 : 0,
        transition: 'opacity 0.18s ease-out',
        zIndex: 20,
        pointerEvents: 'none',
      }}
    />
  );
}
