import { useEffect, useRef, useState } from 'react';
import { playSong, songDurationMs, SONGS, type Song } from '../lib/musicPlayer.ts';
import '../components/ui/ui.css';

export function MusikPage() {
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const [loop, setLoop] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState(SONGS[0]!.id);
  const [isOn, setIsOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!customAudioUrl) return;
    return () => URL.revokeObjectURL(customAudioUrl);
  }, [customAudioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop;
    }
  }, [loop, customAudioUrl]);

  useEffect(() => {
    return () => {
      if (loopTimeoutRef.current !== null) {
        window.clearTimeout(loopTimeoutRef.current);
      }
    };
  }, []);

  function stopLoop() {
    if (loopTimeoutRef.current !== null) {
      window.clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
  }

  function scheduleNextLoop(song: Song) {
    loopTimeoutRef.current = window.setTimeout(() => {
      playSong(song);
      scheduleNextLoop(song);
    }, songDurationMs(song));
  }

  function turnOn() {
    setIsOn(true);
    if (customAudioUrl && audioRef.current) {
      audioRef.current.loop = true;
      void audioRef.current.play();
      return;
    }
    const song = SONGS.find((s) => s.id === selectedSongId) ?? SONGS[0]!;
    playSong(song);
    scheduleNextLoop(song);
  }

  function turnOff() {
    setIsOn(false);
    stopLoop();
    audioRef.current?.pause();
  }

  function toggleMusic() {
    if (isOn) {
      turnOff();
    } else {
      turnOn();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    turnOff();
    setCustomAudioUrl(URL.createObjectURL(file));
    setCustomFileName(file.name);
    e.target.value = '';
  }

  function clearCustomAudio() {
    turnOff();
    setCustomAudioUrl(null);
    setCustomFileName(null);
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <h2 style={{ margin: '0 0 0.25rem' }}>🎵 Musik-PH</h2>
      <p style={{ margin: '0 0 1.5rem', color: '#64748b' }}>
        Putar musik pilihan Anda sendiri dari komputer, atau gunakan nada bawaan.
      </p>

      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
      <div
        style={{
          background: isOn ? '#f0f9ff' : '#fff',
          border: `2px solid ${isOn ? '#0369a1' : '#e2e8f0'}`,
          borderRadius: '14px',
          padding: '2rem',
          display: 'flex',
          flex: '1 1 280px',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          transition: 'background 0.2s, border-color 0.2s',
        }}
      >
        <button
          type="button"
          onClick={toggleMusic}
          className={isOn ? 'musik-ph-toggle--on' : undefined}
          aria-pressed={isOn}
          title={isOn ? 'Matikan musik' : 'Nyalakan musik'}
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: isOn ? '#0369a1' : '#cbd5e1',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
          }}
        >
          {isOn ? '🔊' : '🔈'}
        </button>

        <div style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
          Klinik Prima Husada
        </div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', fontWeight: 600, color: isOn ? '#0369a1' : '#94a3b8' }}>
          {isOn ? '● Musik Menyala' : '○ Musik Mati'}
        </div>

        {!customAudioUrl && (
          <select
            value={selectedSongId}
            onChange={(e) => {
              const wasOn = isOn;
              if (wasOn) turnOff();
              setSelectedSongId(e.target.value);
            }}
            style={{
              marginTop: '1rem',
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
            }}
          >
            {SONGS.map((song) => (
              <option key={song.id} value={song.id}>
                {song.label}
              </option>
            ))}
          </select>
        )}
        {customAudioUrl && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#0369a1' }}>
            🎧 Sumber: {customFileName}
          </div>
        )}
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '1.25rem',
          flex: '1 1 280px',
        }}
      >
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
          Musik dari PC
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label className="btn btn--sm btn--secondary" style={{ cursor: 'pointer', margin: 0 }}>
            📁 Pilih Musik dari PC
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
          {customFileName && (
            <span
              style={{
                fontSize: '0.85rem',
                color: '#0369a1',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              🎧 {customFileName}
              <button
                type="button"
                onClick={clearCustomAudio}
                title="Hapus file"
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  padding: 0,
                }}
              >
                ✕
              </button>
            </span>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#334155' }}>
            <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
            Ulangi
          </label>
        </div>

        {customAudioUrl && (
          <audio
            ref={audioRef}
            src={customAudioUrl}
            controls
            loop={loop}
            style={{ width: '100%', marginTop: '1rem' }}
          />
        )}
      </div>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '1.25rem',
        }}
      >
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
          Nada Bawaan
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {SONGS.map((song) => (
            <div
              key={song.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            >
              <span>{song.label}</span>
              <button
                type="button"
                className="btn btn--sm btn--secondary"
                onClick={() => playSong(song)}
              >
                ▶️ Putar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
