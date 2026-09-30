import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Memory Booth — Retro Photobooth',
  description: 'Step inside. Take four photos. Attach a song. Share a memory.',
  openGraph: {
    title: 'Memory Booth',
    description: 'A retro photobooth for your memories.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
