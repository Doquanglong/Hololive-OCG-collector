import { useWindowDimensions } from 'react-native';

export type GridSize = 'large' | 'small';

const H_PAD = 16; // must match grid contentContainer horizontal padding (spacing.lg)
const GAP = 12; // must match column gap (spacing.md)

function columnsFor(width: number, size: GridSize): number {
  let base: number;
  if (width < 380) base = 2;
  else if (width < 640) base = 3;
  else if (width < 960) base = 4;
  else if (width < 1300) base = 5;
  else base = 6;
  if (size === 'small') base += 1;
  return Math.max(2, base);
}

/** Responsive column count only. */
export function useColumns(size: GridSize): number {
  const { width } = useWindowDimensions();
  return columnsFor(width, size);
}

/**
 * Responsive grid geometry with a FIXED cell width, so every card tile is the
 * same size and a partially-filled last row aligns left instead of stretching.
 */
export function useGrid(size: GridSize): { columns: number; cellWidth: number; gap: number } {
  const { width } = useWindowDimensions();
  const columns = columnsFor(width, size);
  const cellWidth = Math.floor((width - H_PAD * 2 - GAP * (columns - 1)) / columns);
  return { columns, cellWidth, gap: GAP };
}
