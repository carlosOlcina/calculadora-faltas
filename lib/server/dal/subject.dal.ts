import 'server-only';
import { BaseDAL } from './base.dal';
import { NotFoundError, UnauthorizedError } from '../errors';
import { subjectSchemas } from '../schemas';
import type { CourseDTO } from './course.dal';

export interface SubjectDTO {
  id: string;
  name: string;
  hours: number;
  courseId: string;
  convalidate?: boolean;
}

export interface UserSubjectDTO extends SubjectDTO {
  convalidate: boolean;
}

export interface SubjectWithCourseDTO extends UserSubjectDTO {
  course: CourseDTO;
}

export interface ConvalidatedSubjectDTO {
  userId: string;
  subjectId: string;
}

export interface CreateSubjectInput {
  name: string;
  hours: number;
}

export interface UpdateSubjectInput {
  name?: string;
  hours?: number;
}

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

function buildConvalidationSelect(userId: string) {
  return {
    where: { userId },
    select: { subjectId: true },
    take: 1,
  } as const;
}

function mapSubjectWithConvalidation<
  T extends { convalidatedSubjects: { subjectId: string }[] },
>(record: T): Omit<T, 'convalidatedSubjects'> & { convalidate: boolean } {
  const { convalidatedSubjects, ...rest } = record;
  return {
    ...rest,
    convalidate: convalidatedSubjects.length > 0,
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
        },
      });

      return record ? mapSubjectWithConvalidation(record) : null;
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
        },
        orderBy: { name: 'asc' },
      });

      return records.map(mapSubjectWithConvalidation);
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
        },
      });

      return mapSubjectWithConvalidation(record);
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
}

export const subjectDal = new SubjectDAL();
