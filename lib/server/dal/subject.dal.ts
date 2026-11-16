import 'server-only';
import { BaseDAL } from './base.dal';
import { UnauthorizedError } from '../errors';
import { subjectSchemas } from '../schemas';
import type { CourseDTO } from './course.dal';

export interface SubjectDTO {
  id: string;
  name: string;
  hours: number;
  courseId: string;
}

export interface SubjectWithCourseDTO extends SubjectDTO {
  course: CourseDTO;
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

  async create(userId: string, input: CreateSubjectInput): Promise<SubjectDTO> {
    const validUserId = this.validate(subjectSchemas.userId, userId);
    const { name, hours } = this.validate(subjectSchemas.createBody, input);

    return this.execute(async () => {
      const courseId = await this.resolveUserCourseId(validUserId);

      const data = this.validate(subjectSchemas.create, {
        name,
        hours,
        courseId,
      });

      return this.db.subject.create({
        data,
        select: SUBJECT_SELECT,
      });
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

      return this.db.subject.findFirst({
        where: { id: subjectId, courseId },
        select: SUBJECT_WITH_COURSE_SELECT,
      });
    });
  }

  async listByUser(userId: string): Promise<SubjectDTO[]> {
    const validUserId = this.validate(subjectSchemas.userId, userId);

    return this.execute(async () => {
      const courseId = await this.resolveUserCourseId(validUserId);

      return this.db.subject.findMany({
        where: { courseId },
        select: SUBJECT_SELECT,
        orderBy: { name: 'asc' },
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
  ): Promise<SubjectDTO> {
    const subjectId = this.validate(subjectSchemas.id, id);
    const validUserId = this.validate(subjectSchemas.userId, userId);
    const data = this.validate(subjectSchemas.update, input);

    return this.execute(async () => {
      const courseId = await this.resolveUserCourseId(validUserId);

      return this.db.subject.update({
        where: { id: subjectId, courseId },
        data,
        select: SUBJECT_SELECT,
      });
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
}

export const subjectDal = new SubjectDAL();
