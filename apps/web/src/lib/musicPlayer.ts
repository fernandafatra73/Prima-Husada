export type Note = readonly [frequencyHz: number, durationMs: number];

export interface Song {
  readonly id: string;
  readonly label: string;
  readonly notes: readonly Note[];
}

const N = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, Ds5: 622.25, D5: 587.33, E5: 659.25, F5: 698.46,
  A5: 880.0,
};

export const SONGS: readonly Song[] = [
  {
    id: 'twinkle',
    label: '🌟 Twinkle Twinkle',
    notes: [
      [N.C4, 350], [N.C4, 350], [N.G4, 350], [N.G4, 350],
      [N.A4, 350], [N.A4, 350], [N.G4, 600],
      [N.F4, 350], [N.F4, 350], [N.E4, 350], [N.E4, 350],
      [N.D4, 350], [N.D4, 350], [N.C4, 600],
    ],
  },
  {
    id: 'bell',
    label: '🔔 Lonceng',
    notes: [
      [N.E5, 250], [0, 80], [N.C5, 250], [0, 80],
      [N.E5, 250], [0, 80], [N.C5, 250], [0, 300],
      [N.E5, 250], [0, 80], [N.C5, 250], [0, 80],
      [N.E5, 250], [0, 80], [N.C5, 250],
    ],
  },
  {
    id: 'alarm',
    label: '🚨 Alarm Klasik',
    notes: [
      [N.A5, 200], [N.F5, 200], [N.A5, 200], [N.F5, 200],
      [N.A5, 200], [N.F5, 200], [N.A5, 200], [N.F5, 200],
      [N.A5, 200], [N.F5, 200], [N.A5, 200], [N.F5, 200],
    ],
  },
  {
    id: 'elise',
    label: '🎹 Für Elise (potongan)',
    notes: [
      [N.E5, 220], [N.Ds5, 220], [N.E5, 220], [N.Ds5, 220], [N.E5, 220],
      [N.B4, 220], [N.D5, 220], [N.C5, 220], [N.A4, 440],
    ],
  },
];

export function playSong(song: Song): void {
  const ctx = new AudioContext();
  let t = ctx.currentTime;
  for (const [freq, durationMs] of song.notes) {
    const duration = durationMs / 1000;
    if (freq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration);
    }
    t += duration;
  }
  setTimeout(() => void ctx.close(), (t - ctx.currentTime) * 1000 + 500);
}

export function songDurationMs(song: Song): number {
  return song.notes.reduce((sum, [, durationMs]) => sum + durationMs, 0);
}

export function playAlarm(customAudioUrl: string | null, songId: string): void {
  if (customAudioUrl) {
    void new Audio(customAudioUrl).play();
    return;
  }
  const song = SONGS.find((s) => s.id === songId) ?? SONGS[0]!;
  playSong(song);
}
