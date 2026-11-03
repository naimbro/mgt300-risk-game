import { describe, expect, it } from 'vitest';
import { grupoDe } from './formato';

describe('grupoDe', () => {
  it('lee el grupo al inicio del nombre', () => {
    expect(grupoDe('G3 Ana')).toBe(3);
    expect(grupoDe('g11 Pedro')).toBe(11);
    expect(grupoDe('G 03 Ana')).toBe(3);
    expect(grupoDe('Grupo 7 Luis')).toBe(7);
    expect(grupoDe('G3Ana')).toBe(3);
  });
  it('sin prefijo de grupo no hay grupo', () => {
    expect(grupoDe('Ana')).toBeNull();
    expect(grupoDe('Gabriel')).toBeNull();
    expect(grupoDe('G123 Ana')).toBeNull();
  });
});
