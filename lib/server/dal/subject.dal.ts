import 'server-only';
import { z } from 'zod';
import { BaseDAL } from './base.dal';
import {
  positiveIntSchema,
  requiredTextSchema,
  updateObjectSchema,
  uuidSchema,
} from '../validation';
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

const subjectIdSchema = uuidSchema('El id de la asignatura');
const subjectNameSchema = requiredTextSchema('El nombre de la asignatura');
const courseIdSchema = uuidSchema('El id del curso');
const subjectHoursSchema = positiveIntSchema('La cantidad de horas');

const createSubjectSchema = z.object({
  name: subjectNameSchema,
  courseId: courseIdSchema,
  hours: subjectHoursSchema,
});

const updateSubjectSchema = updateObjectSchema({
  name: subjectNameSchema.optional(),
  courseId: courseIdSchema.optional(),
  hours: subjectHoursSchema.optional(),
});

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
    const data = this.validate(createSubjectSchema, input);

    return this.execute(() =>
      this.db.subject.create({
        data,
        select: SUBJECT_SELECT,
      }),
    );
  }

  async findById(id: string): Promise<SubjectWithCourseDTO | null> {
    const subjectId = this.validate(subjectIdSchema, id);

    return this.execute(() =>
      this.db.subject.findUnique({
        where: { id: subjectId },
        select: SUBJECT_WITH_COURSE_SELECT,
      }),
    );
  }

  async listByCourse(courseId: string): Promise<SubjectDTO[]> {
    const validCourseId = this.validate(courseIdSchema, courseId);

    return this.execute(() =>
      this.db.subject.findMany({
        where: { courseId: validCourseId },
        select: SUBJECT_SELECT,
        orderBy: { name: 'asc' },
      }),
    );
  }

  async update(id: string, input: UpdateSubjectInput): Promise<SubjectDTO> {
    const subjectId = this.validate(subjectIdSchema, id);
    const data = this.validate(updateSubjectSchema, input);

    return this.execute(() =>
      this.db.subject.update({
        where: { id: subjectId },
        data,
        select: SUBJECT_SELECT,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    const subjectId = this.validate(subjectIdSchema, id);

    await this.execute(() =>
      this.db.subject.delete({
        where: { id: subjectId },
      }),
    );
  }
}

export const subjectDal = new SubjectDAL();
