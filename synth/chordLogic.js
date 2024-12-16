/**
 * chordLogic: helper functions to build chord note arrays
 */

export function buildChordIndices(rootIndex, chordMode='triad') {
    // returns an array of note indices in the scale
    // e.g. diatonic triads in major scale
    const triads = [
      [0,2,4], [1,3,5], [2,4,6],
      [3,5,0], [4,6,1], [5,0,2], [6,1,3],
    ];
  
    if (chordMode === 'triad') {
      return triads[rootIndex];
    }
    // could add more chord modes: seventh chords, etc.
    return [rootIndex]; // Return single note index
  }
