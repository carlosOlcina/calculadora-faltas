import { describe, expect, it } from 'vitest';
import {
  applySubjectIndices,
  computeDropReorderPlan,
  computeRequestedIndexForDrop,
  sortSubjectsByIndex,
} from '../subject-order';

describe('subject-order helpers', () => {
  it('ordena asignaturas indexadas primero por índice y luego sin índice alfabéticamente', () => {
    const ordered = sortSubjectsByIndex([
      { id: '1', name: 'Sistemas', index: null },
      { id: '2', name: 'Bases de Datos', index: 1.1 },
      { id: '3', name: 'Álgebra', index: null },
      { id: '4', name: 'Programación', index: 1 },
      { id: '5', name: 'Entornos', index: 2 },
    ]);

    expect(ordered.map((s) => s.id)).toEqual(['4', '2', '5', '3', '1']);
  });

  it('applySubjectIndices actualiza índices desde el servidor y reordena la lista', () => {
    const initial = [
      { id: 'a', name: 'Asignatura A', index: null },
      { id: 'b', name: 'Asignatura B', index: null },
      { id: 'c', name: 'Asignatura C', index: null },
    ];

    const updated = applySubjectIndices(initial, [
      { subjectId: 'c', index: 1 },
      { subjectId: 'a', index: 1.1 },
    ]);

    expect(updated).toEqual([
      { id: 'c', name: 'Asignatura C', index: 1 },
      { id: 'a', name: 'Asignatura A', index: 1.1 },
      { id: 'b', name: 'Asignatura B', index: null },
    ]);
  });

  it('cuando no hay índices previos, arrastrar una tarjeta a la posición 3 solicita índice 3', () => {
    const list = [
      { id: 'a', index: null },
      { id: 'b', index: null },
      { id: 'c', index: null },
      { id: 'd', index: null },
    ];

    expect(computeRequestedIndexForDrop(list, 'a', 'c')).toBe(3);
  });

  it('arrastrar antes de un elemento con índice decimal solicita exactamente ese decimal', () => {
    const list = [
      { id: 'a', index: 1 },
      { id: 'b', index: 1.1 },
      { id: 'c', index: 2 },
    ];

    expect(computeRequestedIndexForDrop(list, 'c', 'b')).toBe(1.1);
  });

  it('arrastrar justo después del último elemento indexado solicita el siguiente entero', () => {
    const list = [
      { id: 'a', index: 1 },
      { id: 'b', index: 1.1 },
      { id: 'c', index: null },
      { id: 'd', index: null },
    ];

    expect(computeRequestedIndexForDrop(list, 'd', 'c')).toBe(2);
  });

  it('arrastrar entre elementos sin índice cuando ya hay indexados pide al menos maxBucket + 1', () => {
    const list = [
      { id: 'a', index: 1 },
      { id: 'b', index: 2 },
      { id: 'c', index: null },
      { id: 'd', index: null },
      { id: 'e', index: null },
    ];

    expect(computeRequestedIndexForDrop(list, 'e', 'd')).toBe(4);
  });

  it('devuelve null si origen y destino coinciden o no existen en la lista', () => {
    const list = [
      { id: 'a', index: 1 },
      { id: 'b', index: 2 },
    ];

    expect(computeRequestedIndexForDrop(list, 'a', 'a')).toBeNull();
    expect(computeRequestedIndexForDrop(list, 'a', 'missing')).toBeNull();
    expect(computeRequestedIndexForDrop(list, 'missing', 'b')).toBeNull();
  });

  describe('computeDropReorderPlan', () => {
    it('incluye el elemento previo sin índice al soltar en la 2ª posición sobre elementos sin indexar', () => {
      const list = [
        { id: 'a', index: null },
        { id: 'b', index: null },
        { id: 'c', index: null },
      ];

      expect(computeDropReorderPlan(list, 'c', 'b')).toEqual({
        subjectId: 'c',
        requestedIndex: 2,
        precedingSubjectIds: ['a'],
      });
    });

    it('al intercambiar los dos primeros elementos sin índice indexa el nuevo primero como previo', () => {
      const list = [
        { id: 'a', index: null },
        { id: 'b', index: null },
        { id: 'c', index: null },
      ];

      expect(computeDropReorderPlan(list, 'a', 'b')).toEqual({
        subjectId: 'a',
        requestedIndex: 2,
        precedingSubjectIds: ['b'],
      });
    });

    it('soltar en la primera posición cuando no hay índices previos mantiene precedingSubjectIds vacío', () => {
      const list = [
        { id: 'a', index: null },
        { id: 'b', index: null },
        { id: 'c', index: null },
      ];

      expect(computeDropReorderPlan(list, 'c', 'a')).toEqual({
        subjectId: 'c',
        requestedIndex: 1,
        precedingSubjectIds: [],
      });
    });

    it('incluye todos los elementos previos sin índice al soltar en la 3ª posición', () => {
      const list = [
        { id: 'a', index: null },
        { id: 'b', index: null },
        { id: 'c', index: null },
      ];

      expect(computeDropReorderPlan(list, 'a', 'c')).toEqual({
        subjectId: 'a',
        requestedIndex: 3,
        precedingSubjectIds: ['b', 'c'],
      });
    });

    it('calcula requestedIndex y precedingSubjectIds con decimales previos sin sobrepedir huecos', () => {
      const list = [
        { id: 'a', index: 1 },
        { id: 'b', index: 1.1 },
        { id: 'c', index: null },
        { id: 'd', index: null },
        { id: 'e', index: null },
      ];

      expect(computeDropReorderPlan(list, 'e', 'd')).toEqual({
        subjectId: 'e',
        requestedIndex: 3,
        precedingSubjectIds: ['c'],
      });
    });

    it('evita colisiones cuando existen huecos de cubos previos antes de elementos sin índice', () => {
      const list = [
        { id: 'a', index: 1 },
        { id: 'b', index: 3 },
        { id: 'c', index: null },
        { id: 'd', index: null },
        { id: 'e', index: null },
      ];

      expect(computeDropReorderPlan(list, 'e', 'd')).toEqual({
        subjectId: 'e',
        requestedIndex: 5,
        precedingSubjectIds: ['c'],
      });
    });

    it('al arrastrar un elemento ya indexado más allá de elementos sin índice incluye todos los previos sin índice', () => {
      const list = [
        { id: 'x', index: 1 },
        { id: 'a', index: null },
        { id: 'b', index: null },
        { id: 'c', index: null },
      ];

      expect(computeDropReorderPlan(list, 'x', 'b')).toEqual({
        subjectId: 'x',
        requestedIndex: 4,
        precedingSubjectIds: ['a', 'b'],
      });
    });

    it('soltar justo después del último elemento indexado no requiere indexar los siguientes sin índice', () => {
      const list = [
        { id: 'a', index: 1 },
        { id: 'b', index: 1.1 },
        { id: 'c', index: null },
        { id: 'd', index: null },
      ];

      expect(computeDropReorderPlan(list, 'd', 'c')).toEqual({
        subjectId: 'd',
        requestedIndex: 2,
        precedingSubjectIds: [],
      });
    });

    it('soltar antes de un elemento ya indexado solicita su mismo decimal sin precedingSubjectIds', () => {
      const list = [
        { id: 'a', index: 1 },
        { id: 'b', index: 1.1 },
        { id: 'c', index: 2 },
      ];

      expect(computeDropReorderPlan(list, 'c', 'b')).toEqual({
        subjectId: 'c',
        requestedIndex: 1.1,
        precedingSubjectIds: [],
      });
    });

    it('devuelve null cuando origen y destino coinciden o alguno no existe', () => {
      const list = [
        { id: 'a', index: 1 },
        { id: 'b', index: null },
      ];

      expect(computeDropReorderPlan(list, 'a', 'a')).toBeNull();
      expect(computeDropReorderPlan(list, 'a', 'missing')).toBeNull();
      expect(computeDropReorderPlan(list, 'missing', 'b')).toBeNull();
    });
  });
});
