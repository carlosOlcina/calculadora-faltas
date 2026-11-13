import 'server-only';
import { BaseDAL } from './base.dal';
import { courseSchemas } from '../schemas';

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
    const data = this.validate(courseSchemas.create, input);

    return this.execute(() =>
      this.db.course.create({
        data,
        select: COURSE_SELECT,
      }),
    );
  }

  async findById(id: string): Promise<CourseDTO | null> {
    const courseId = this.validate(courseSchemas.id, id);

    return this.execute(() =>
      this.db.course.findUnique({
        where: { id: courseId },
        select: COURSE_SELECT,
      }),
    );
  }

  async findByName(name: string): Promise<CourseDTO | null> {
    const normalizedName = this.validate(courseSchemas.name, name);

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
    const courseId = this.validate(courseSchemas.id, id);
    const data = this.validate(courseSchemas.update, input);

    return this.execute(() =>
      this.db.course.update({
        where: { id: courseId },
        data,
        select: COURSE_SELECT,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    const courseId = this.validate(courseSchemas.id, id);

    await this.execute(() =>
      this.db.course.delete({
        where: { id: courseId },
      }),
    );
  }
}

export const courseDal = new CourseDAL();
