import 'server-only';
import { z } from 'zod';
import { BaseDAL } from './base.dal';
import {
  positiveIntSchema,
  requiredTextSchema,
  updateObjectSchema,
  uuidSchema,
} from '../validation';

export interface CourseDTO {
  id: string;
  name: string;
  totalHours: number;
}

export interface CreateCourseInput {
  name: string;
  totalHours: number;
}

export interface UpdateCourseInput {
  name?: string;
  totalHours?: number;
}

const courseIdSchema = uuidSchema('El id del curso');
const courseNameSchema = requiredTextSchema('El nombre del curso');
const courseHoursSchema = positiveIntSchema('La duracion total en horas');

const createCourseSchema = z.object({
  name: courseNameSchema,
  totalHours: courseHoursSchema,
});

const updateCourseSchema = updateObjectSchema({
  name: courseNameSchema.optional(),
  totalHours: courseHoursSchema.optional(),
});

const COURSE_SELECT = {
  id: true,
  name: true,
  totalHours: true,
} as const;

/**
 * Capa de acceso a datos para la tabla `cursos`.
 */
export class CourseDAL extends BaseDAL {
  async create(input: CreateCourseInput): Promise<CourseDTO> {
    const data = this.validate(createCourseSchema, input);

    return this.execute(() =>
      this.db.course.create({
        data,
        select: COURSE_SELECT,
      }),
    );
  }

  async findById(id: string): Promise<CourseDTO | null> {
    const courseId = this.validate(courseIdSchema, id);

    return this.execute(() =>
      this.db.course.findUnique({
        where: { id: courseId },
        select: COURSE_SELECT,
      }),
    );
  }

  async findByName(name: string): Promise<CourseDTO | null> {
    const normalizedName = this.validate(courseNameSchema, name);

    return this.execute(() =>
      this.db.course.findUnique({
        where: { name: normalizedName },
        select: COURSE_SELECT,
      }),
    );
  }

  async listAll(): Promise<CourseDTO[]> {
    return this.execute(() =>
      this.db.course.findMany({
        select: COURSE_SELECT,
        orderBy: { name: 'asc' },
      }),
    );
  }

  async update(id: string, input: UpdateCourseInput): Promise<CourseDTO> {
    const courseId = this.validate(courseIdSchema, id);
    const data = this.validate(updateCourseSchema, input);

    return this.execute(() =>
      this.db.course.update({
        where: { id: courseId },
        data,
        select: COURSE_SELECT,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    const courseId = this.validate(courseIdSchema, id);

    await this.execute(() =>
      this.db.course.delete({
        where: { id: courseId },
      }),
    );
  }
}

export const courseDal = new CourseDAL();
