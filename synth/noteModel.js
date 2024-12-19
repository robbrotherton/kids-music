const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MIN_OCTAVE = 0;
const MAX_OCTAVE = 8;

export class NoteModel {
  constructor() {
    this.allNotes = [];
    for (let octave = MIN_OCTAVE; octave <= MAX_OCTAVE; octave++) {
      NOTES.forEach(note => {
        this.allNotes.push({
          note,
          octave,
          freq: `${note}${octave}`,
          midiNote: this.noteToMidi(note, octave)
        });
      });
    }
  }

  noteToMidi(note, octave) {
    return NOTES.indexOf(note) + (octave + 1) * 12;
  }

  midiToNote(midi) {
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    return this.allNotes.find(n => n.note === NOTES[noteIndex] && n.octave === octave);
  }

  getOctaveNotes(octave) {
    return this.allNotes.filter(n => n.octave === octave);
  }

  getNearbyNotes(baseNote, range) {
    const baseMidi = this.noteToMidi(baseNote.note, baseNote.octave);
    return this.allNotes.filter(n => {
      const distance = Math.abs(n.midiNote - baseMidi);
      return distance <= range;
    });
  }
}
