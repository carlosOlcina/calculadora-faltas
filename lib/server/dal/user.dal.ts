import 'server-only';
import type { PrismaClient } from '@/generated/prisma/client';
import { BaseDAL } from './base.dal';
import { PasswordHasher, passwordHasher } from '../password-hasher';
import { userSchemas } from '../schemas';
import type { CourseDTO } from './course.dal';

export interface UserDTO {
  id: string;
  name: string;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithCourseDTO extends UserDTO {
  course: CourseDTO;
}

export interface CreateUserInput {
  name: string;
  password: string;
  courseId: string;
}

export interface UpdateUserInput {
  name?: string;
  password?: string;
  courseId?: string;
}

/**
 * Seleccion publica segura: excluye `passwordHash` para evitar filtraciones
 * accidentales hacia Server Actions o Client Components.
 */
const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  courseId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const USER_WITH_COURSE_SELECT = {
  ...USER_PUBLIC_SELECT,
  course: {
    select: {
      id: true,
      name: true,
      totalHours: true,
    },
  },
} as const;

/**
 * Capa de acceso a datos para la tabla `usuarios`.
 * Calcula el hash bcrypt al crear/actualizar contrasenas y nunca expone `passwordHash`.
 */
export class UserDAL extends BaseDAL {
  private readonly hasher: PasswordHasher;

  constructor(db?: PrismaClient, hasher: PasswordHasher = passwordHasher) {
    super(db);
    this.hasher = hasher;
  }

  async create(input: CreateUserInput): Promise<UserWithCourseDTO> {
    const { name, password, courseId } = this.validate(
      userSchemas.create,
      input,
    );
    const passwordHash = await this.hasher.hash(password);

    return this.execute(() =>
      this.db.user.create({
        data: {
          name,
          passwordHash,
          courseId,
        },
        select: USER_WITH_COURSE_SELECT,
      }),
    );
  }

  async findById(id: string): Promise<UserWithCourseDTO | null> {
    const userId = this.validate(userSchemas.id, id);

    return this.execute(() =>
      this.db.user.findUnique({
        where: { id: userId },
        select: USER_WITH_COURSE_SELECT,
      }),
    );
  }

  async findByName(name: string): Promise<UserWithCourseDTO | null> {
    const normalizedName = this.validate(userSchemas.name, name);

    return this.execute(() =>
      this.db.user.findUnique({
        where: { name: normalizedName },
        select: USER_WITH_COURSE_SELECT,
      }),
    );
  }

  async findAuthByName(name: string): Promise<{
    id: string;
    name: string;
    courseId: string;
    passwordHash: string;
  } | null> {
    const normalizedName = this.validate(userSchemas.name, name);

    return this.execute(() =>
      this.db.user.findUnique({
        where: { name: normalizedName },
        select: {
          id: true,
          name: true,
          courseId: true,
          passwordHash: true,
        },
      }),
    );
  }

  async listByCourse(courseId: string): Promise<UserDTO[]> {
    const validCourseId = this.validate(userSchemas.courseId, courseId);

    return this.execute(() =>
      this.db.user.findMany({
        where: { courseId: validCourseId },
        select: USER_PUBLIC_SELECT,
        orderBy: { name: 'asc' },
      }),
    );
  }

  async update(id: string, input: UpdateUserInput): Promise<UserWithCourseDTO> {
    const userId = this.validate(userSchemas.id, id);
    const { password, ...rest } = this.validate(userSchemas.update, input);
    const data: {
      name?: string;
      courseId?: string;
      passwordHash?: string;
    } = { ...rest };

    if (password !== undefined) {
      data.passwordHash = await this.hasher.hash(password);
    }

    return this.execute(() =>
      this.db.user.update({
        where: { id: userId },
        data,
        select: USER_WITH_COURSE_SELECT,
      }),
    );
  }

  /**
   * Comprueba las credenciales de un usuario comparando la contrasena contra su hash bcrypt.
   * Devuelve el DTO publico sin `passwordHash` si es valido, o `null` en caso contrario.
   */
  async verifyCredentials(
    name: string,
    plainPassword: string,
  ): Promise<UserWithCourseDTO | null> {
    const normalizedName = this.validate(userSchemas.name, name);
    if (!userSchemas.password.safeParse(plainPassword).success) {
      return null;
    }

    const record = await this.execute(() =>
      this.db.user.findUnique({
        where: { name: normalizedName },
        select: {
          ...USER_WITH_COURSE_SELECT,
          passwordHash: true,
        },
      }),
    );

    if (!record) {
      return null;
    }

    const isValid = await this.hasher.verify(plainPassword, record.passwordHash);
    if (!isValid) {
      return null;
    }

    const { passwordHash: _omitted, ...publicUser } = record;
    void _omitted;
    return publicUser;
  }

  async delete(id: string): Promise<void> {
    const userId = this.validate(userSchemas.id, id);

    await this.execute(() =>
      this.db.user.delete({
        where: { id: userId },
      }),
    );
  }
}

export const userDal = new UserDAL();
