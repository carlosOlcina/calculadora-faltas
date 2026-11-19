import { describe, expect, it } from 'vitest';
import {
  computeSubjectIndexUpdate,
  type SubjectIndexEntry,
  type SubjectIndexPlan,
} from '../subject-index-algorithm';

function assertPlanInvariants(plan: SubjectIndexPlan) {
  const seenSubjects = new Set<string>();
  const seenIndices = new Set<number>();

  if (plan.entries.length > 0) {
    expect(Math.floor(plan.entries[0].index)).toBe(1);
  }

  for (let i = 0; i < plan.entries.length; i += 1) {
    const entry = plan.entries[i];
    expect(entry.index).toBeGreaterThanOrEqual(1);
    expect(Math.abs(entry.index * 10 - Math.round(entry.index * 10))).toBeLessThan(
      1e-9,
    );
    expect(seenSubjects.has(entry.subjectId)).toBe(false);
    expect(seenIndices.has(entry.index)).toBe(false);
    seenSubjects.add(entry.subjectId);
    seenIndices.add(entry.index);

    if (i > 0) {
      expect(plan.entries[i - 1].index).toBeLessThan(entry.index);
    }
  }
}

describe('computeSubjectIndexUpdate', () => {
  it('asigna 1 cuando no hay índices previos y se solicita 1', () => {
    const plan = computeSubjectIndexUpdate([], 'sub-a', 1);

    expect(plan.assignedIndex).toBe(1);
    expect(plan.reindexed).toBe(false);
    expect(plan.entries).toEqual([{ subjectId: 'sub-a', index: 1 }]);
    expect(plan.changed).toEqual([{ subjectId: 'sub-a', index: 1 }]);
    assertPlanInvariants(plan);
  });

  it.each([2, 5, 3.5])(
    'clamp a 1 cuando no existe posición 1 y se solicita %s',
    (requested) => {
      const plan = computeSubjectIndexUpdate([], 'sub-a', requested);

      expect(plan.assignedIndex).toBe(1);
      expect(plan.reindexed).toBe(false);
      expect(plan.entries).toEqual([{ subjectId: 'sub-a', index: 1 }]);
      assertPlanInvariants(plan);
    },
  );

  it('asigna índices enteros consecutivos 1, 2, 3 sin colisión', () => {
    let entries: SubjectIndexEntry[] = [];

    const step1 = computeSubjectIndexUpdate(entries, 'sub-a', 1);
    entries = step1.entries;
    const step2 = computeSubjectIndexUpdate(entries, 'sub-b', 2);
    entries = step2.entries;
    const step3 = computeSubjectIndexUpdate(entries, 'sub-c', 3);

    expect(step3.reindexed).toBe(false);
    expect(step3.assignedIndex).toBe(3);
    expect(step3.entries).toEqual([
      { subjectId: 'sub-a', index: 1 },
      { subjectId: 'sub-b', index: 2 },
      { subjectId: 'sub-c', index: 3 },
    ]);
    assertPlanInvariants(step3);
  });

  it('elimina huecos al solicitar índices más altos que el siguiente entero disponible', () => {
    const p1 = computeSubjectIndexUpdate([{ subjectId: 'a', index: 1 }], 'b', 4);
    expect(p1.assignedIndex).toBe(2);
    expect(p1.entries).toEqual([
      { subjectId: 'a', index: 1 },
      { subjectId: 'b', index: 2 },
    ]);

    const p2 = computeSubjectIndexUpdate(
      [
        { subjectId: 'a', index: 1 },
        { subjectId: 'b', index: 1.1 },
      ],
      'c',
      3,
    );
    expect(p2.assignedIndex).toBe(2);
    expect(p2.entries).toEqual([
      { subjectId: 'a', index: 1 },
      { subjectId: 'b', index: 1.1 },
      { subjectId: 'c', index: 2 },
    ]);

    const p3 = computeSubjectIndexUpdate(
      [
        { subjectId: 'a', index: 1 },
        { subjectId: 'b', index: 1.1 },
      ],
      'c',
      2.4,
    );
    expect(p3.assignedIndex).toBe(2);
    assertPlanInvariants(p3);
  });

  it('desplaza el índice existente a 1.1 cuando hay colisión en 1', () => {
    const plan = computeSubjectIndexUpdate(
      [{ subjectId: 'a', index: 1 }],
      'b',
      1,
    );

    expect(plan.assignedIndex).toBe(1);
    expect(plan.reindexed).toBe(false);
    expect(plan.entries).toEqual([
      { subjectId: 'b', index: 1 },
      { subjectId: 'a', index: 1.1 },
    ]);
    expect(plan.changed).toEqual([
      { subjectId: 'b', index: 1 },
      { subjectId: 'a', index: 1.1 },
    ]);
    assertPlanInvariants(plan);
  });

  it('soporta colisiones en cascada desde 1.0 hasta 1.9 sin reindexar ni perder precisión decimal', () => {
    let entries: SubjectIndexEntry[] = [];
    for (let i = 1; i <= 10; i += 1) {
      const plan = computeSubjectIndexUpdate(entries, `sub-${i}`, 1);
      expect(plan.reindexed).toBe(false);
      expect(plan.assignedIndex).toBe(1);
      assertPlanInvariants(plan);
      entries = plan.entries;
    }

    expect(entries).toEqual([
      { subjectId: 'sub-10', index: 1 },
      { subjectId: 'sub-9', index: 1.1 },
      { subjectId: 'sub-8', index: 1.2 },
      { subjectId: 'sub-7', index: 1.3 },
      { subjectId: 'sub-6', index: 1.4 },
      { subjectId: 'sub-5', index: 1.5 },
      { subjectId: 'sub-4', index: 1.6 },
      { subjectId: 'sub-3', index: 1.7 },
      { subjectId: 'sub-2', index: 1.8 },
      { subjectId: 'sub-1', index: 1.9 },
    ]);
  });

  it('dispara reindex completo a enteros cuando una colisión en 1 superaría 1.9', () => {
    let entries: SubjectIndexEntry[] = [];
    for (let i = 1; i <= 10; i += 1) {
      entries = computeSubjectIndexUpdate(entries, `sub-${i}`, 1).entries;
    }

    const overflowPlan = computeSubjectIndexUpdate(entries, 'sub-11', 1);

    expect(overflowPlan.reindexed).toBe(true);
    expect(overflowPlan.assignedIndex).toBe(1);
    expect(overflowPlan.entries).toEqual([
      { subjectId: 'sub-11', index: 1 },
      { subjectId: 'sub-10', index: 2 },
      { subjectId: 'sub-9', index: 3 },
      { subjectId: 'sub-8', index: 4 },
      { subjectId: 'sub-7', index: 5 },
      { subjectId: 'sub-6', index: 6 },
      { subjectId: 'sub-5', index: 7 },
      { subjectId: 'sub-4', index: 8 },
      { subjectId: 'sub-3', index: 9 },
      { subjectId: 'sub-2', index: 10 },
      { subjectId: 'sub-1', index: 11 },
    ]);
    assertPlanInvariants(overflowPlan);
  });

  it('preserva el orden de cubos superiores al reindexar por desbordamiento en el cubo 1', () => {
    const entries: SubjectIndexEntry[] = [];
    for (let i = 0; i < 10; i += 1) {
      entries.push({ subjectId: `b1-${i}`, index: Number((1 + i * 0.1).toFixed(1)) });
    }
    entries.push({ subjectId: 'b2-0', index: 2 });
    entries.push({ subjectId: 'b3-0', index: 3 });

    const plan = computeSubjectIndexUpdate(entries, 'new-first', 1);

    expect(plan.reindexed).toBe(true);
    expect(plan.entries.map((e) => e.subjectId)).toEqual([
      'new-first',
      'b1-0',
      'b1-1',
      'b1-2',
      'b1-3',
      'b1-4',
      'b1-5',
      'b1-6',
      'b1-7',
      'b1-8',
      'b1-9',
      'b2-0',
      'b3-0',
    ]);
    expect(plan.entries.map((e) => e.index)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    ]);
    assertPlanInvariants(plan);
  });

  it('dispara reindex completo si desborda el cubo 2 conservando antes los elementos del cubo 1', () => {
    const entries: SubjectIndexEntry[] = [
      { subjectId: 'b1-0', index: 1 },
      { subjectId: 'b1-1', index: 1.1 },
    ];
    for (let i = 0; i < 10; i += 1) {
      entries.push({ subjectId: `b2-${i}`, index: Number((2 + i * 0.1).toFixed(1)) });
    }
    entries.push({ subjectId: 'b3-0', index: 3 });

    const plan = computeSubjectIndexUpdate(entries, 'new-b2', 2);

    expect(plan.reindexed).toBe(true);
    expect(plan.assignedIndex).toBe(3);
    expect(plan.entries[0]).toEqual({ subjectId: 'b1-0', index: 1 });
    expect(plan.entries[1]).toEqual({ subjectId: 'b1-1', index: 2 });
    expect(plan.entries[2]).toEqual({ subjectId: 'new-b2', index: 3 });
    expect(plan.entries[plan.entries.length - 1]).toEqual({
      subjectId: 'b3-0',
      index: 14,
    });
    assertPlanInvariants(plan);
  });

  it('reindexa cuando se colisiona directamente en 1.9 aunque existan huecos decimales previos', () => {
    const entries: SubjectIndexEntry[] = [
      { subjectId: 'a', index: 1 },
      { subjectId: 'b', index: 1.1 },
      { subjectId: 'c', index: 1.9 },
    ];

    const plan = computeSubjectIndexUpdate(entries, 'd', 1.9);

    expect(plan.reindexed).toBe(true);
    expect(plan.assignedIndex).toBe(3);
    expect(plan.entries).toEqual([
      { subjectId: 'a', index: 1 },
      { subjectId: 'b', index: 2 },
      { subjectId: 'd', index: 3 },
      { subjectId: 'c', index: 4 },
    ]);
    assertPlanInvariants(plan);
  });

  it('desplaza solo la cadena contigua sin tocar 1.9 si hay hueco decimal intermedio', () => {
    const entries: SubjectIndexEntry[] = [
      { subjectId: 'a', index: 1 },
      { subjectId: 'b', index: 1.1 },
      { subjectId: 'c', index: 1.9 },
    ];

    const plan = computeSubjectIndexUpdate(entries, 'd', 1);

    expect(plan.reindexed).toBe(false);
    expect(plan.entries).toEqual([
      { subjectId: 'd', index: 1 },
      { subjectId: 'a', index: 1.1 },
      { subjectId: 'b', index: 1.2 },
      { subjectId: 'c', index: 1.9 },
    ]);
    expect(plan.changed).toEqual([
      { subjectId: 'd', index: 1 },
      { subjectId: 'a', index: 1.1 },
      { subjectId: 'b', index: 1.2 },
    ]);
    assertPlanInvariants(plan);
  });

  it('permite inserción directa sobre un decimal existente como 1.1', () => {
    const plan = computeSubjectIndexUpdate(
      [
        { subjectId: 'a', index: 1 },
        { subjectId: 'b', index: 1.1 },
      ],
      'c',
      1.1,
    );

    expect(plan.reindexed).toBe(false);
    expect(plan.assignedIndex).toBe(1.1);
    expect(plan.entries).toEqual([
      { subjectId: 'a', index: 1 },
      { subjectId: 'c', index: 1.1 },
      { subjectId: 'b', index: 1.2 },
    ]);
    assertPlanInvariants(plan);
  });

  describe('movimiento de asignaturas ya indexadas (upsert)', () => {
    it('mueve C(3) a 1 provocando desplazamiento solo en cubo 1', () => {
      const plan = computeSubjectIndexUpdate(
        [
          { subjectId: 'a', index: 1 },
          { subjectId: 'b', index: 2 },
          { subjectId: 'c', index: 3 },
        ],
        'c',
        1,
      );

      expect(plan.reindexed).toBe(false);
      expect(plan.entries).toEqual([
        { subjectId: 'c', index: 1 },
        { subjectId: 'a', index: 1.1 },
        { subjectId: 'b', index: 2 },
      ]);
      assertPlanInvariants(plan);
    });

    it('al mover B(2) a 1 y luego insertar D en 3, rellena primero el hueco del 2', () => {
      const moveB = computeSubjectIndexUpdate(
        [
          { subjectId: 'a', index: 1 },
          { subjectId: 'b', index: 2 },
          { subjectId: 'c', index: 3 },
        ],
        'b',
        1,
      );

      expect(moveB.reindexed).toBe(false);
      expect(moveB.entries).toEqual([
        { subjectId: 'b', index: 1 },
        { subjectId: 'a', index: 1.1 },
        { subjectId: 'c', index: 3 },
      ]);

      const insertD = computeSubjectIndexUpdate(moveB.entries, 'd', 3);
      expect(insertD.reindexed).toBe(false);
      expect(insertD.assignedIndex).toBe(2);
      expect(insertD.entries).toEqual([
        { subjectId: 'b', index: 1 },
        { subjectId: 'a', index: 1.1 },
        { subjectId: 'd', index: 2 },
        { subjectId: 'c', index: 3 },
      ]);
      assertPlanInvariants(insertD);
    });

    it('normaliza si al mover un elemento el cubo 1 queda completamente vacío', () => {
      const plan = computeSubjectIndexUpdate(
        [
          { subjectId: 'a', index: 1 },
          { subjectId: 'b', index: 2 },
        ],
        'a',
        3,
      );

      expect(plan.reindexed).toBe(true);
      expect(plan.assignedIndex).toBe(2);
      expect(plan.entries).toEqual([
        { subjectId: 'b', index: 1 },
        { subjectId: 'a', index: 2 },
      ]);
      assertPlanInvariants(plan);
    });

    it('no reindexa al mover A(1.0) a 3 si D(1.1) permanece en el cubo 1', () => {
      const plan = computeSubjectIndexUpdate(
        [
          { subjectId: 'a', index: 1 },
          { subjectId: 'd', index: 1.1 },
          { subjectId: 'b', index: 2 },
        ],
        'a',
        3,
      );

      expect(plan.reindexed).toBe(false);
      expect(plan.assignedIndex).toBe(3);
      expect(plan.entries).toEqual([
        { subjectId: 'd', index: 1.1 },
        { subjectId: 'b', index: 2 },
        { subjectId: 'a', index: 3 },
      ]);
      assertPlanInvariants(plan);
    });

    it('resuelve desplazamiento cíclico dentro del mismo cubo (1.2 -> 1.0)', () => {
      const plan = computeSubjectIndexUpdate(
        [
          { subjectId: 'a', index: 1 },
          { subjectId: 'b', index: 1.1 },
          { subjectId: 'c', index: 1.2 },
        ],
        'c',
        1,
      );

      expect(plan.reindexed).toBe(false);
      expect(plan.entries).toEqual([
        { subjectId: 'c', index: 1 },
        { subjectId: 'a', index: 1.1 },
        { subjectId: 'b', index: 1.2 },
      ]);
      assertPlanInvariants(plan);
    });

    it('devuelve changed vacío cuando la asignatura ya ocupa el índice solicitado', () => {
      const plan = computeSubjectIndexUpdate(
        [
          { subjectId: 'a', index: 1 },
          { subjectId: 'b', index: 2 },
        ],
        'b',
        2,
      );

      expect(plan.reindexed).toBe(false);
      expect(plan.assignedIndex).toBe(2);
      expect(plan.changed).toEqual([]);
      assertPlanInvariants(plan);
    });
  });
});
