import { Card, CardType, TypeGroup } from '../types';

export const TYPE_GROUPS: TypeGroup[] = ['Oshi', 'Holomem', 'Support', 'Cheer'];

export function typeGroup(t: CardType): TypeGroup {
  if (t === 'Oshi holomem') return 'Oshi';
  if (t === 'Cheer') return 'Cheer';
  if (t.startsWith('Support')) return 'Support';
  return 'Holomem'; // Debut / 1st / 2nd Bloom / Buzz / SPOT
}

export const TYPE_GROUP_COLOR: Record<TypeGroup, string> = {
  Oshi: '#ff9f43',
  Holomem: '#4b8ef0',
  Support: '#3fb968',
  Cheer: '#ff7ac6',
};

export type SortKey = 'number' | 'name' | 'type' | 'color';

export const SORT_LABEL: Record<SortKey, string> = {
  number: 'Card no.',
  name: 'Name',
  type: 'Type',
  color: 'Color',
};

const GROUP_ORDER: Record<TypeGroup, number> = {
  Oshi: 0,
  Holomem: 1,
  Support: 2,
  Cheer: 3,
};

export function sortCards(cards: Card[], key: SortKey): Card[] {
  const out = [...cards];
  switch (key) {
    case 'name':
      out.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
      break;
    case 'type':
      out.sort(
        (a, b) =>
          GROUP_ORDER[typeGroup(a.type)] - GROUP_ORDER[typeGroup(b.type)] ||
          a.setcode.localeCompare(b.setcode),
      );
      break;
    case 'color':
      out.sort((a, b) => a.color.localeCompare(b.color) || a.setcode.localeCompare(b.setcode));
      break;
    case 'number':
    default:
      out.sort((a, b) => a.setcode.localeCompare(b.setcode, undefined, { numeric: true }));
  }
  return out;
}
