/**
 * chordLogic: helper functions to build chord note arrays
 */

export function buildChordIndices(rootIndex, chordSize = 1) {
  if (chordSize <= 1) return [{index: rootIndex, octave: 0}];

  // Define intervals for more musical chord voicings
  // Format: [halfSteps from root, scale degree]
  const chordStructures = new Map([
    [1, [[0, 0]]],                    // single note
    [2, [[0, 0], [4, 2]]],           // root + third
    [3, [[0, 0], [4, 2], [7, 4]]],   // triad
    [4, [[0, 0], [4, 2], [7, 4], [12, 0]]],  // triad + octave
    [5, [[-12, 0], [0, 0], [4, 2], [7, 4], [12, 0]]],  // two octaves + triad
    [6, [[-12, 0], [-5, 5], [0, 0], [4, 2], [7, 4], [12, 0]]],  // wide voicing
    [7, [[-12, 0], [-7, 4], [0, 0], [4, 2], [7, 4], [11, 6], [12, 0]]]  // full chord
  ]);

  const intervals = chordStructures.get(chordSize) || [[0, 0]];

  return intervals.map(([halfSteps, scaleOffset]) => {
    // Calculate the scale index wrapping within the scale
    let noteIndex = ((rootIndex + scaleOffset) % 7 + 7) % 7;
    // Calculate which octave this note should be in
    let octave = Math.floor(halfSteps / 12);
    
    return {
      index: noteIndex,
      octave: octave
    };
  });
}
