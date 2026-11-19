import 'server-only';
import { Prisma } from '@/generated/prisma/client';
import { BaseDAL } from './base.dal';
import { NotFoundError, UnauthorizedError } from '../errors';
import { subjectSchemas } from '../schemas';
import {
  computeSubjectIndexUpdate,
  formatTenths,
  toTenths,
  type SubjectIndexEntry,
} from '../subject-index-algorithm';
import type { CourseDTO } from './course.dal';

export interface SubjectDTO {
  id: string;
  name: string;
  hours: number;
  courseId: string;
  convalidate?: boolean;
  index?: number | null;
}

export interface UserSubjectDTO extends SubjectDTO {
  convalidate: boolean;
  index: number | null;
}

export interface SubjectWithCourseDTO extends UserSubjectDTO {
  course: CourseDTO;
}

export interface ConvalidatedSubjectDTO {
  userId: string;
  subjectId: string;
}

export interface SubjectIndexDTO {
  userId: string;
  subjectId: string;
  index: number;
}

export interface SetSubjectIndexResult {
  created: boolean;
  index: number;
  reindexed: boolean;
  subjectIndex: SubjectIndexDTO;
  indices: SubjectIndexEntry[];
}

export interface CreateSubjectInput {
  name: string;
  hours: number;
}

export interface UpdateSubjectInput {
  name?: string;
  hours?: number;
}

const MAX_SERIALIZABLE_RETRIES = 3;

const SUBJECT_SELECT = {
  id: true,
  name: true,
  hours: true,
  courseId: true,
} as const;

const SUBJECT_WITH_COURSE_SELECT = {
  ...SUBJECT_SELECT,
  course: {
    select: {
      id: true,
      name: true,
      totalHours: true,
    },
  },
} as const;

const CONVALIDATED_SUBJECT_SELECT = {
  userId: true,
  subjectId: true,
} as const;

const SUBJECT_INDEX_SELECT = {
  userId: true,
  subjectId: true,
  index: true,
} as const;

function buildConvalidationSelect(userId: string) {
  return {
    where: { userId },
    select: { subjectId: true },
    take: 1,
  } as const;
}

function buildSubjectIndexSelect(userId: string) {
  return {
    where: { userId },
    select: { index: true },
    take: 1,
  } as const;
}

function mapSubjectWithUserMetadata<
  T extends {
    convalidatedSubjects: { subjectId: string }[];
    subjectIndices: { index: Prisma.Decimal | number | string }[];
  },
>(
  record: T,
): Omit<T, 'convalidatedSubjects' | 'subjectIndices'> & {
  convalidate: boolean;
  index: number | null;
} {
  const { convalidatedSubjects, subjectIndices, ...rest } = record;
  return {
    ...rest,
    convalidate: convalidatedSubjects.length > 0,
    index: subjectIndices[0] ? Number(subjectIndices[0].index) : null,
  };
}

/**
 * Capa de acceso a datos para la tabla `asignaturas`.
 * Las operaciones asociadas a un usuario operan sobre las asignaturas de su curso.
 */
export class SubjectDAL extends BaseDAL {
  private async resolveUserCourseId(userId: string): Promise<string> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { courseId: true },
    });

    if (!user) {
      throw new UnauthorizedError('El usuario autenticado no existe.');
    }

    return user.courseId;
  }

  private async ensureUserSubject(
    subjectId: string,
    userId: string,
  ): Promise<void> {
    const courseId = await this.resolveUserCourseId(userId);
    const subject = await this.db.subject.findFirst({
      where: { id: subjectId, courseId },
      select: { id: true },
    });

    if (!subject) {
      throw new NotFoundError('No se encontró la asignatura solicitada.');
    }
  }

  async create(
    userId: string,
    input: CreateSubjectInput,
  ): Promise<UserSubjectDTO> {
    const validUserId = this.validate(subjectSchemas.userId, userId);
    const { name, hours } = this.validate(subjectSchemas.createBody, input);

    return this.execute(async () => {
      const courseId = await this.resolveUserCourseId(validUserId);

      const data = this.validate(subjectSchemas.create, {
        name,
        hours,
        courseId,
      });

      const created = await this.db.subject.create({
        data,
        select: SUBJECT_SELECT,
      });

      return {
        ...created,
        convalidate: false,
        index: null,
      };
    });
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<SubjectWithCourseDTO | null> {
    const subjectId = this.validate(subjectSchemas.id, id);
    const validUserId = this.validate(subjectSchemas.userId, userId);

    return this.execute(async () => {
      const courseId = await this.resolveUserCourseId(validUserId);

      const record = await this.db.subject.findFirst({
        where: { id: subjectId, courseId },
        select: {
          ...SUBJECT_WITH_COURSE_SELECT,
          convalidatedSubjects: buildConvalidationSelect(validUserId),
          subjectIndices: buildSubjectIndexSelect(validUserId),
        },
      });

      return record ? mapSubjectWithUserMetadata(record) : null;
    });
  }

  async listByUser(userId: string): Promise<UserSubjectDTO[]> {
    const validUserId = this.validate(subjectSchemas.userId, userId);

    return this.execute(async () => {
      const courseId = await this.resolveUserCourseId(validUserId);

      const records = await this.db.subject.findMany({
        where: { courseId },
        select: {
          ...SUBJECT_SELECT,
          convalidatedSubjects: buildConvalidationSelect(validUserId),
          subjectIndices: buildSubjectIndexSelect(validUserId),
        },
        orderBy: { name: 'asc' },
      });

      const mapped = records.map(mapSubjectWithUserMetadata);
      return mapped.sort((a, b) => {
        if (a.index !== null && b.index !== null) {
          return a.index - b.index;
        }
        if (a.index !== null) {
          return -1;
        }
        if (b.index !== null) {
          return 1;
        }
        return 0;
      });
    });
  }

  async listByCourse(courseId: string): Promise<SubjectDTO[]> {
    const validCourseId = this.validate(subjectSchemas.courseId, courseId);

    return this.execute(() =>
      this.db.subject.findMany({
        where: { courseId: validCourseId },
        select: SUBJECT_SELECT,
        orderBy: { name: 'asc' },
      }),
    );
  }

  async update(
    id: string,
    userId: string,
    input: UpdateSubjectInput,
  ): Promise<UserSubjectDTO> {
    const subjectId = this.validate(subjectSchemas.id, id);
    const validUserId = this.validate(subjectSchemas.userId, userId);
    const data = this.validate(subjectSchemas.update, input);

    return this.execute(async () => {
      const courseId = await this.resolveUserCourseId(validUserId);

      const record = await this.db.subject.update({
        where: { id: subjectId, courseId },
        data,
        select: {
          ...SUBJECT_SELECT,
          convalidatedSubjects: buildConvalidationSelect(validUserId),
          subjectIndices: buildSubjectIndexSelect(validUserId),
        },
      });

      return mapSubjectWithUserMetadata(record);
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const subjectId = this.validate(subjectSchemas.id, id);
    const validUserId = this.validate(subjectSchemas.userId, userId);

    await this.execute(async () => {
      const courseId = await this.resolveUserCourseId(validUserId);

      return this.db.subject.delete({
        where: { id: subjectId, courseId },
      });
    });
  }

  async getConvalidation(
    subjectId: string,
    userId: string,
  ): Promise<ConvalidatedSubjectDTO | null> {
    const validSubjectId = this.validate(subjectSchemas.id, subjectId);
    const validUserId = this.validate(subjectSchemas.userId, userId);

    return this.execute(async () => {
      await this.ensureUserSubject(validSubjectId, validUserId);

      return this.db.convalidatedSubject.findUnique({
        where: {
          userId_subjectId: {
            userId: validUserId,
            subjectId: validSubjectId,
          },
        },
        select: CONVALIDATED_SUBJECT_SELECT,
      });
    });
  }

  async convalidate(
    subjectId: string,
    userId: string,
  ): Promise<ConvalidatedSubjectDTO> {
    const data = this.validate(subjectSchemas.convalidate, {
      userId,
      subjectId,
    });

    return this.execute(async () => {
      await this.ensureUserSubject(data.subjectId, data.userId);

      return this.db.convalidatedSubject.create({
        data,
        select: CONVALIDATED_SUBJECT_SELECT,
      });
    });
  }

  async unconvalidate(subjectId: string, userId: string): Promise<void> {
    const data = this.validate(subjectSchemas.convalidate, {
      userId,
      subjectId,
    });

    await this.execute(async () => {
      await this.ensureUserSubject(data.subjectId, data.userId);

      return this.db.convalidatedSubject.delete({
        where: {
          userId_subjectId: {
            userId: data.userId,
            subjectId: data.subjectId,
          },
        },
      });
    });
  }

  async getIndex(
    subjectId: string,
    userId: string,
  ): Promise<SubjectIndexDTO | null> {
    const validSubjectId = this.validate(subjectSchemas.id, subjectId);
    const validUserId = this.validate(subjectSchemas.userId, userId);

    return this.execute(async () => {
      await this.ensureUserSubject(validSubjectId, validUserId);

      const record = await this.db.subjectIndex.findUnique({
        where: {
          userId_subjectId: {
            userId: validUserId,
            subjectId: validSubjectId,
          },
        },
        select: SUBJECT_INDEX_SELECT,
      });

      return record
        ? {
            userId: record.userId,
            subjectId: record.subjectId,
            index: Number(record.index),
          }
        : null;
    });
  }

  async setIndex(
    subjectId: string,
    userId: string,
    requestedIndex: number,
    precedingSubjectIds?: readonly string[],
  ): Promise<SetSubjectIndexResult> {
    const data = this.validate(subjectSchemas.setIndex, {
      userId,
      subjectId,
      index: requestedIndex,
      precedingSubjectIds,
    });

    return this.execute(async () => {
      for (let attempt = 0; attempt < MAX_SERIALIZABLE_RETRIES; attempt += 1) {
        try {
          return await this.db.$transaction(
            async (tx) => {
              const user = await tx.user.findUnique({
                where: { id: data.userId },
                select: { courseId: true },
              });

              if (!user) {
                throw new UnauthorizedError(
                  'El usuario autenticado no existe.',
                );
              }

              if (data.precedingSubjectIds.length === 0) {
                const subject = await tx.subject.findFirst({
                  where: { id: data.subjectId, courseId: user.courseId },
                  select: { id: true },
                });

                if (!subject) {
                  throw new NotFoundError(
                    'No se encontró la asignatura solicitada.',
                  );
                }
              } else {
                const requiredSubjectIds = [
                  data.subjectId,
                  ...data.precedingSubjectIds,
                ];
                const matchingSubjects = await tx.subject.findMany({
                  where: {
                    id: { in: requiredSubjectIds },
                    courseId: user.courseId,
                  },
                  select: { id: true },
                });

                if (matchingSubjects.length !== requiredSubjectIds.length) {
                  throw new NotFoundError(
                    'No se encontró la asignatura solicitada.',
                  );
                }
              }

              const existingRows = await tx.subjectIndex.findMany({
                where: { userId: data.userId },
                select: { subjectId: true, index: true },
                orderBy: { index: 'asc' },
              });

              const currentEntries: SubjectIndexEntry[] = existingRows.map(
                (row) => ({
                  subjectId: row.subjectId,
                  index: Number(row.index),
                }),
              );
              const created = !currentEntries.some(
                (entry) => entry.subjectId === data.subjectId,
              );

              const plan = computeSubjectIndexUpdate(
                currentEntries,
                data.subjectId,
                data.index,
                data.precedingSubjectIds,
              );

              if (plan.changed.length > 0) {
                await tx.subjectIndex.deleteMany({
                  where: {
                    userId: data.userId,
                    subjectId: {
                      in: plan.changed.map((entry) => entry.subjectId),
                    },
                  },
                });

                await tx.subjectIndex.createMany({
                  data: plan.changed.map((entry) => ({
                    userId: data.userId,
                    subjectId: entry.subjectId,
                    index: formatTenths(toTenths(entry.index)),
                  })),
                });
              }

              return {
                created,
                index: plan.assignedIndex,
                reindexed: plan.reindexed,
                subjectIndex: {
                  userId: data.userId,
                  subjectId: data.subjectId,
                  index: plan.assignedIndex,
                },
                indices: plan.entries,
              };
            },
            {
              isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            },
          );
        } catch (error) {
          const isSerializationConflict =
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2034';

          if (
            !isSerializationConflict ||
            attempt === MAX_SERIALIZABLE_RETRIES - 1
          ) {
            throw error;
          }
        }
      }

      throw new Error('No se pudo completar la actualización del índice.');
    });
  }
}

export const subjectDal = new SubjectDAL();
