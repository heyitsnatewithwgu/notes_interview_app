import { NOTE_COLORS, getNoteColorClasses } from '@/types/note';

describe('note color helpers', () => {
  it('defines all 8 note colors including default', () => {
    expect(NOTE_COLORS).toHaveLength(8);
    expect(NOTE_COLORS.map((c) => c.value)).toEqual([
      'default',
      'red',
      'orange',
      'yellow',
      'green',
      'blue',
      'purple',
      'pink',
    ]);
  });

  it('returns light + dark background classes for a known color', () => {
    expect(getNoteColorClasses('red')).toBe('bg-red-100 dark:bg-red-950');
  });

  it('falls back to bg-card for an unknown color', () => {
    expect(getNoteColorClasses('mauve' as never)).toBe('bg-card');
  });
});
