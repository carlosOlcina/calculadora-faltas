import { describe, expect, it } from 'vitest';
import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { computeDropReorderPlan } from '@/lib/utils/subject-order';
import { SubjectDAL } from '../dal/subject.dal';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors';
import { subjectSchemas } from '../schemas';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_COURSE_ID = '22222222-2222-4222-8222-222222222222';
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const UNKNOWN_USER = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function createSubjectId(num: number): string {
  return `00000000-0000-4000-8000-${String(num).padStart(12, '0')}`;
}

interface MockSubjectRow {
  id: string;
  name: string;
  hours: number;
  courseId: string;
}

interface MockIndexRow {
  userId: string;
  subjectId: string;
  index: string;
}

function createInMemoryPrisma(options?: {
  subjectCount?: number;
  failFirstTransactionsWithP2034?: number;
}) {
  const subjectCount = options?.subjectCount ?? 12;
  let remainingP2034 = options?.failFirstTransactionsWithP2034 ?? 0;

  const users = new Map<string, { id: string; courseId: string }>([
    [USER_A, { id: USER_A, courseId: COURSE_ID }],
    [USER_B, { id: USER_B, courseId: COURSE_ID }],
  ]);

  const subjects: MockSubjectRow[] = Array.from(
    { length: subjectCount },
    (_, i) => ({
      id: createSubjectId(i + 1),
      name: `Asignatura ${String(i + 1).padStart(2, '0')}`,
      hours: 100 + i,
      courseId: COURSE_ID,
    }),
  );

  const foreignSubject: MockSubjectRow = {
    id: '99999999-9999-4999-8999-999999999999',
    name: 'Asignatura Ajena',
    hours: 80,
    courseId: OTHER_COURSE_ID,
  };
  const allSubjects = [...subjects, foreignSubject];

  let subjectIndices: MockIndexRow[] = [];

  function buildDelegates(getRows: () => MockIndexRow[], setRows: (next: MockIndexRow[]) => void) {
    return {
      user: {
        findUnique: async ({ where }: { where: { id: string } }) => {
          const user = users.get(where.id);
          return user ? { courseId: user.courseId } : null;
        },
      },
      subject: {
        findFirst: async ({
          where,
        }: {
          where: { id: string; courseId: string };
        }) => {
          const match = allSubjects.find(
            (s) => s.id === where.id && s.courseId === where.courseId,
          );
          return match ? { id: match.id } : null;
        },
        findMany: async ({
          where,
          select,
        }: {
          where: { courseId: string; id?: { in: string[] } };
          select: {
            id?: boolean;
            convalidatedSubjects?: { where: { userId: string } };
            subjectIndices?: { where: { userId: string } };
          };
        }) => {
          const allowedIds = where.id?.in ? new Set(where.id.in) : null;
          const rows = allSubjects
            .filter(
              (s) =>
                s.courseId === where.courseId &&
                (allowedIds === null || allowedIds.has(s.id)),
            )
            .sort((a, b) => a.name.localeCompare(b.name));

          return rows.map((row) => {
            const targetUserId = select.subjectIndices?.where.userId;
            const userIndex = targetUserId
              ? getRows().find(
                  (entry) =>
                    entry.userId === targetUserId && entry.subjectId === row.id,
                )
              : undefined;

            return {
              id: row.id,
              name: row.name,
              hours: row.hours,
              courseId: row.courseId,
              convalidatedSubjects: [],
              subjectIndices: userIndex ? [{ index: userIndex.index }] : [],
            };
          });
        },
      },
      subjectIndex: {
        findUnique: async ({
          where,
        }: {
          where: { userId_subjectId: { userId: string; subjectId: string } };
        }) => {
          const match = getRows().find(
            (r) =>
              r.userId === where.userId_subjectId.userId &&
              r.subjectId === where.userId_subjectId.subjectId,
          );
          return match ?? null;
        },
        findMany: async ({
          where,
        }: {
          where: { userId: string };
        }) => {
          return getRows()
            .filter((r) => r.userId === where.userId)
            .sort((a, b) => Number(a.index) - Number(b.index));
        },
        deleteMany: async ({
          where,
        }: {
          where: { userId: string; subjectId: { in: string[] } };
        }) => {
          const toDelete = new Set(where.subjectId.in);
          const current = getRows();
          const remaining = current.filter(
            (r) => !(r.userId === where.userId && toDelete.has(r.subjectId)),
          );
          setRows(remaining);
          return { count: current.length - remaining.length };
        },
        createMany: async ({
          data,
        }: {
          data: Array<{ userId: string; subjectId: string; index: string }>;
        }) => {
          const next = [...getRows()];
          for (const row of data) {
            const pkConflict = next.some(
              (r) => r.userId === row.userId && r.subjectId === row.subjectId,
            );
            const uniqueIndexConflict = next.some(
              (r) =>
                r.userId === row.userId &&
                Number(r.index) === Number(row.index),
            );
            if (pkConflict || uniqueIndexConflict) {
              throw new Prisma.PrismaClientKnownRequestError(
                'Unique constraint failed on the fields: (`user_id`,`index`)',
                {
                  code: 'P2002',
                  clientVersion: '7.10.1',
                  meta: { target: ['user_id', 'index'] },
                },
              );
            }
            next.push({
              userId: row.userId,
              subjectId: row.subjectId,
              index: row.index,
            });
          }
          setRows(next);
          return { count: data.length };
        },
      },
    };
  }

  const rootDelegates = buildDelegates(
    () => subjectIndices,
    (next) => {
      subjectIndices = next;
    },
  );

  const client = {
    ...rootDelegates,
    $transaction: async <T>(
      callback: (tx: typeof rootDelegates) => Promise<T>,
    ): Promise<T> => {
      if (remainingP2034 > 0) {
        remainingP2034 -= 1;
        throw new Prisma.PrismaClientKnownRequestError(
          'Transaction failed due to a write conflict or a deadlock',
          {
            code: 'P2034',
            clientVersion: '7.10.1',
          },
        );
      }

      let txRows = subjectIndices.map((row) => ({ ...row }));
      const txDelegates = buildDelegates(
        () => txRows,
        (next) => {
          txRows = next;
        },
      );
      const result = await callback(txDelegates);
      subjectIndices = txRows;
      return result;
    },
  };

  return {
    db: client as unknown as PrismaClient,
    subjects,
    foreignSubject,
  };
}

describe('SubjectDAL subject indexing', () => {
  it('por defecto no crea filas en subject_indices y listByUser devuelve index: null ordenado por nombre', async () => {
    const { db, subjects } = createInMemoryPrisma({ subjectCount: 4 });
    const dal = new SubjectDAL(db);

    const list = await dal.listByUser(USER_A);
    expect(list.map((s) => s.id)).toEqual(subjects.map((s) => s.id));
    expect(list.every((s) => s.index === null)).toBe(true);
    expect(await dal.getIndex(subjects[0].id, USER_A)).toBeNull();
  });

  it('crea índices de forma perezosa y clampa a 1 si no existía 1', async () => {
    const { db, subjects } = createInMemoryPrisma({ subjectCount: 4 });
    const dal = new SubjectDAL(db);

    const res = await dal.setIndex(subjects[2].id, USER_A, 3);
    expect(res.created).toBe(true);
    expect(res.index).toBe(1);
    expect(res.reindexed).toBe(false);

    const list = await dal.listByUser(USER_A);
    expect(list[0]).toMatchObject({ id: subjects[2].id, index: 1 });
    expect(list.slice(1).map((s) => s.id)).toEqual([
      subjects[0].id,
      subjects[1].id,
      subjects[3].id,
    ]);
    expect(list.slice(1).every((s) => s.index === null)).toBe(true);
  });

  it('ejecuta colisiones hasta .9 y reindexado completo sin violar @@unique([userId, index])', async () => {
    const { db, subjects } = createInMemoryPrisma({ subjectCount: 11 });
    const dal = new SubjectDAL(db);

    for (let i = 0; i < 10; i += 1) {
      const result = await dal.setIndex(subjects[i].id, USER_A, 1);
      expect(result.reindexed).toBe(false);
      expect(result.index).toBe(1);
    }

    const overflow = await dal.setIndex(subjects[10].id, USER_A, 1);
    expect(overflow.created).toBe(true);
    expect(overflow.reindexed).toBe(true);
    expect(overflow.index).toBe(1);
    expect(overflow.indices.map((e) => e.index)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);

    const list = await dal.listByUser(USER_A);
    expect(list.map((s) => s.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(list[0].id).toBe(subjects[10].id);
    expect(list[10].id).toBe(subjects[0].id);
  });

  it('soporta desplazamientos cíclicos al mover un elemento existente sin error P2002', async () => {
    const { db, subjects } = createInMemoryPrisma({ subjectCount: 4 });
    const dal = new SubjectDAL(db);

    await dal.setIndex(subjects[0].id, USER_A, 1);
    await dal.setIndex(subjects[1].id, USER_A, 2);
    await dal.setIndex(subjects[2].id, USER_A, 3);

    const moved = await dal.setIndex(subjects[2].id, USER_A, 1);
    expect(moved.created).toBe(false);
    expect(moved.index).toBe(1);
    expect(moved.indices).toEqual([
      { subjectId: subjects[2].id, index: 1 },
      { subjectId: subjects[0].id, index: 1.1 },
      { subjectId: subjects[1].id, index: 2 },
    ]);
  });

  it('aisla completamente los índices por usuario', async () => {
    const { db, subjects } = createInMemoryPrisma({ subjectCount: 3 });
    const dal = new SubjectDAL(db);

    await dal.setIndex(subjects[0].id, USER_A, 1);
    await dal.setIndex(subjects[2].id, USER_B, 1);

    const listA = await dal.listByUser(USER_A);
    const listB = await dal.listByUser(USER_B);

    expect(listA[0]).toMatchObject({ id: subjects[0].id, index: 1 });
    expect(listB[0]).toMatchObject({ id: subjects[2].id, index: 1 });
    expect(await dal.getIndex(subjects[0].id, USER_B)).toBeNull();
  });

  it('reintenta automáticamente si ocurre conflicto Serializable P2034', async () => {
    const { db, subjects } = createInMemoryPrisma({
      subjectCount: 2,
      failFirstTransactionsWithP2034: 2,
    });
    const dal = new SubjectDAL(db);

    const result = await dal.setIndex(subjects[0].id, USER_A, 1);
    expect(result.index).toBe(1);
  });

  it('valida entradas inválidas, usuario inexistente y asignatura fuera de curso', async () => {
    const { db, subjects, foreignSubject } = createInMemoryPrisma({
      subjectCount: 2,
    });
    const dal = new SubjectDAL(db);

    await expect(
      dal.setIndex(subjects[0].id, UNKNOWN_USER, 1),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    await expect(
      dal.setIndex(foreignSubject.id, USER_A, 1),
    ).rejects.toBeInstanceOf(NotFoundError);

    for (const invalidIndex of [0, -1, 1.25, Number.NaN]) {
      await expect(
        dal.setIndex(subjects[0].id, USER_A, invalidIndex),
      ).rejects.toBeInstanceOf(ValidationError);
    }
  });

  it('al soltar una asignatura en la 2ª posición sobre elementos sin indexar crea índice al primero y mantiene el orden esperado', async () => {
    const { db } = createInMemoryPrisma({ subjectCount: 4 });
    const dal = new SubjectDAL(db);

    const initialList = await dal.listByUser(USER_A);
    const plan = computeDropReorderPlan(
      initialList,
      initialList[2].id,
      initialList[1].id,
    );
    expect(plan).toEqual({
      subjectId: initialList[2].id,
      requestedIndex: 2,
      precedingSubjectIds: [initialList[0].id],
    });

    const result = await dal.setIndex(
      plan!.subjectId,
      USER_A,
      plan!.requestedIndex,
      plan!.precedingSubjectIds,
    );
    expect(result.created).toBe(true);
    expect(result.index).toBe(2);
    expect(result.indices).toEqual([
      { subjectId: initialList[0].id, index: 1 },
      { subjectId: initialList[2].id, index: 2 },
    ]);

    const updatedList = await dal.listByUser(USER_A);
    expect(updatedList.map((s) => s.id)).toEqual([
      initialList[0].id,
      initialList[2].id,
      initialList[1].id,
      initialList[3].id,
    ]);
    expect(updatedList.map((s) => s.index)).toEqual([1, 2, null, null]);
  });

  it('al mover la primera asignatura ya indexada más allá de elementos sin índice los indexa antes y reindexa sin P2002', async () => {
    const { db, subjects } = createInMemoryPrisma({ subjectCount: 4 });
    const dal = new SubjectDAL(db);

    await dal.setIndex(subjects[0].id, USER_A, 1);
    const listBefore = await dal.listByUser(USER_A);

    const plan = computeDropReorderPlan(
      listBefore,
      subjects[0].id,
      subjects[2].id,
    );
    expect(plan).toEqual({
      subjectId: subjects[0].id,
      requestedIndex: 4,
      precedingSubjectIds: [subjects[1].id, subjects[2].id],
    });

    const moved = await dal.setIndex(
      plan!.subjectId,
      USER_A,
      plan!.requestedIndex,
      plan!.precedingSubjectIds,
    );
    expect(moved.created).toBe(false);
    expect(moved.reindexed).toBe(true);
    expect(moved.index).toBe(3);
    expect(moved.indices).toEqual([
      { subjectId: subjects[1].id, index: 1 },
      { subjectId: subjects[2].id, index: 2 },
      { subjectId: subjects[0].id, index: 3 },
    ]);

    const listAfter = await dal.listByUser(USER_A);
    expect(listAfter.map((s) => s.id)).toEqual([
      subjects[1].id,
      subjects[2].id,
      subjects[0].id,
      subjects[3].id,
    ]);
    expect(listAfter.map((s) => s.index)).toEqual([1, 2, 3, null]);
  });

  it('mantiene intacto el índice existente de una asignatura incluida en precedingSubjectIds', async () => {
    const { db, subjects } = createInMemoryPrisma({ subjectCount: 4 });
    const dal = new SubjectDAL(db);

    await dal.setIndex(subjects[0].id, USER_A, 1);

    const res = await dal.setIndex(subjects[2].id, USER_A, 3, [
      subjects[0].id,
      subjects[1].id,
    ]);
    expect(res.indices).toEqual([
      { subjectId: subjects[0].id, index: 1 },
      { subjectId: subjects[1].id, index: 2 },
      { subjectId: subjects[2].id, index: 3 },
    ]);
    expect(await dal.getIndex(subjects[0].id, USER_A)).toEqual({
      userId: USER_A,
      subjectId: subjects[0].id,
      index: 1,
    });
  });

  it('rechaza con NotFoundError y no persiste ningún índice si precedingSubjectIds contiene una asignatura ajena o inexistente', async () => {
    const { db, subjects, foreignSubject } = createInMemoryPrisma({
      subjectCount: 3,
    });
    const dal = new SubjectDAL(db);

    await expect(
      dal.setIndex(subjects[1].id, USER_A, 3, [
        subjects[0].id,
        foreignSubject.id,
      ]),
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      dal.setIndex(subjects[1].id, USER_A, 3, [
        subjects[0].id,
        'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      ]),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(await dal.getIndex(subjects[0].id, USER_A)).toBeNull();
    expect(await dal.getIndex(subjects[1].id, USER_A)).toBeNull();
  });

  it('valida UUIDs inválidos, duplicados y autoinclusión en precedingSubjectIds y setIndexBody', async () => {
    const { db, subjects } = createInMemoryPrisma({ subjectCount: 3 });
    const dal = new SubjectDAL(db);

    await expect(
      dal.setIndex(subjects[1].id, USER_A, 2, ['no-es-uuid']),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      dal.setIndex(subjects[1].id, USER_A, 2, [subjects[0].id, subjects[0].id]),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      dal.setIndex(subjects[1].id, USER_A, 2, [subjects[1].id]),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(subjectSchemas.setIndexBody.safeParse({ index: 1 }).success).toBe(
      true,
    );
    expect(
      subjectSchemas.setIndexBody.safeParse({
        index: 2,
        precedingSubjectIds: [subjects[0].id],
      }).success,
    ).toBe(true);
    expect(
      subjectSchemas.setIndexBody.safeParse({
        index: 2,
        precedingSubjectIds: [subjects[0].id, subjects[0].id],
      }).success,
    ).toBe(false);
    expect(
      subjectSchemas.setIndexBody.safeParse({
        index: 2,
        precedingSubjectIds: ['invalido'],
      }).success,
    ).toBe(false);
  });
});
