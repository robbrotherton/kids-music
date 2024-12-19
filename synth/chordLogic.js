/**
 * Build chord notes based on a root note's MIDI number and position in key
 */

// Simplified chord qualities (just triads)
const CHORD_QUALITIES = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6]
};

// Define chord qualities for each scale degree (triads only)
const SCALE_DEGREE_QUALITIES = [
  'major',     // I
  'minor',     // ii
  'minor',     // iii
  'major',     // IV
  'major',     // V
  'minor',     // vi
  'diminished' // vii°
];

// Map ALL chromatic notes to their nearest diatonic scale degree
const CHROMATIC_TO_DIATONIC = {
  0: 0,   // C  -> I
  1: 0,   // C# -> I (borrowed)
  2: 1,   // D  -> ii
  3: 1,   // D# -> ii (borrowed)
  4: 2,   // E  -> iii
  5: 3,   // F  -> IV
  6: 3,   // F# -> IV (borrowed)
  7: 4,   // G  -> V
  8: 4,   // G# -> V (borrowed)
  9: 5,   // A  -> vi
  10: 5,  // A# -> vi (borrowed)
  11: 6   // B  -> vii°
};

export function buildChord(rootMidi, chordSize = 1, keyRoot = 60) { // 60 = middle C
  if (chordSize <= 1) return [rootMidi];

  // Calculate semitones from key root
  const semitones = (rootMidi - keyRoot + 120) % 12;
  // Convert to scale degree using the map
  const scaleDegree = CHROMATIC_TO_DIATONIC[semitones];
  
  // Get chord quality based on scale degree
  const quality = SCALE_DEGREE_QUALITIES[scaleDegree];
  const triad = CHORD_QUALITIES[quality];

  // Build full chord structure using only triad notes across octaves
  let intervals;
  switch (chordSize) {
    case 2: intervals = [0, triad[1]]; break;                      // root + third
    case 3: intervals = triad; break;                              // basic triad
    case 4: intervals = [...triad, 12]; break;                     // triad + octave
    case 5: intervals = [-12, ...triad, 12]; break;               // triad + octaves
    case 6: intervals = [-12, -12 + triad[1], ...triad, 12]; break; // two triads
    case 7: intervals = [-12, -12 + triad[1], ...triad, 12, 12 + triad[1]]; break; // full range
    default: intervals = [0];
  }

  return intervals.map(interval => rootMidi + interval);
}
