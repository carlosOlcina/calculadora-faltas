import 'server-only';
import { BaseDAL } from './base.dal';
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
  courseId: string;
  hours: number;
}

export interface UpdateSubjectInput {
  name?: string;
  courseId?: string;
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
 */
export class SubjectDAL extends BaseDAL {
  async create(input: CreateSubjectInput): Promise<SubjectDTO> {
    const data = this.validate(subjectSchemas.create, input);

    return this.execute(() =>
      this.db.subject.create({
        data,
        select: SUBJECT_SELECT,
      }),
    );
  }

  async findById(id: string): Promise<SubjectWithCourseDTO | null> {
    const subjectId = this.validate(subjectSchemas.id, id);

    return this.execute(() =>
      this.db.subject.findUnique({
        where: { id: subjectId },
        select: SUBJECT_WITH_COURSE_SELECT,
      }),
    );
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

  async update(id: string, input: UpdateSubjectInput): Promise<SubjectDTO> {
    const subjectId = this.validate(subjectSchemas.id, id);
    const data = this.validate(subjectSchemas.update, input);

    return this.execute(() =>
      this.db.subject.update({
        where: { id: subjectId },
        data,
        select: SUBJECT_SELECT,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    const subjectId = this.validate(subjectSchemas.id, id);

    await this.execute(() =>
      this.db.subject.delete({
        where: { id: subjectId },
      }),
    );
  }
}

export const subjectDal = new SubjectDAL();
