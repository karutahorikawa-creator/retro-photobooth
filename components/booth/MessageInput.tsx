'use client';

interface Props {
  value: string;
  onChange(msg: string): void;
  onBack(): void;
  onConfirm(): void;
}

const MAX_LENGTH = 300;

export default function MessageInput({ value, onChange, onBack, onConfirm }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#F5F0E8', fontFamily: '"Special Elite", serif', marginBottom: 2 }}>
          Leave a message?
        </p>
        <p style={{ fontSize: 10, color: '#7A6A5A', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Optional · will appear on the back of the strip
        </p>
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          placeholder={"this song always reminds me of you ♡"}
          value={value}
          onChange={e => onChange(e.target.value.slice(0, MAX_LENGTH))}
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#0D0805',
            border: '1.5px solid #3D2B1F',
            borderRadius: 4,
            color: '#F5F0E8',
            fontFamily: '"Special Elite", "Courier New", monospace',
            fontSize: 12,
            outline: 'none',
            resize: 'none',
            boxSizing: 'border-box',
            lineHeight: 1.5,
          }}
        />
        <span style={{
          position: 'absolute',
          bottom: 8,
          right: 10,
          fontSize: 9,
          color: value.length > MAX_LENGTH * 0.85 ? '#C4372A' : '#5A4A3A',
          fontFamily: 'monospace',
        }}>
          {value.length}/{MAX_LENGTH}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onBack}
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
          }}
        >
          ← Back
        </button>
        <button
          onClick={onConfirm}
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
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          CREATE MEMORY ♡
        </button>
      </div>
    </div>
  );
}
