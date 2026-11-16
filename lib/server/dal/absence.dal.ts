import 'server-only';
import { BaseDAL } from './base.dal';
import { NotFoundError } from '../errors';
import { absenceSchemas } from '../schemas';
import type { SubjectDTO } from './subject.dal';

export interface AbsenceDTO {
  id: string;
  userId: string;
  subjectId: string;
  hoursMissed: number;
  justified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AbsenceWithSubjectDTO extends AbsenceDTO {
  subject: SubjectDTO;
}

export interface CreateAbsenceInput {
  subjectId: string;
  hoursMissed: number;
  justified?: boolean;
}

export interface UpdateAbsenceInput {
  subjectId?: string;
  hoursMissed?: number;
  justified?: boolean;
}

const ABSENCE_SELECT = {
  id: true,
  userId: true,
  subjectId: true,
  hoursMissed: true,
  justified: true,
  createdAt: true,
  updatedAt: true,
} as const;

const ABSENCE_WITH_SUBJECT_SELECT = {
  ...ABSENCE_SELECT,
  subject: {
    select: {
      id: true,
      name: true,
      hours: true,
      courseId: true,
    },
  },
} as const;

/**
 * Capa de acceso a datos para la tabla `faltas`.
 * Todas las operaciones filtran por `userId` y validan pertenencia de la asignatura.
 */
export class AbsenceDAL extends BaseDAL {
  private async ensureOwnedSubject(
    subjectId: string,
    userId: string,
  ): Promise<void> {
    const subject = await this.db.subject.findFirst({
      where: {
        id: subjectId,
        course: {
          users: {
            some: { id: userId },
          },
        },
      },
      select: { id: true },
    });

    if (!subject) {
      throw new NotFoundError('No se encontró la asignatura solicitada.');
    }
  }

  async create(
    userId: string,
    input: CreateAbsenceInput,
  ): Promise<AbsenceDTO> {
    const validUserId = this.validate(absenceSchemas.userId, userId);
    const { subjectId, hoursMissed, justified } = this.validate(
      absenceSchemas.createBody,
      input,
    );

    return this.execute(async () => {
      await this.ensureOwnedSubject(subjectId, validUserId);

      const data = this.validate(absenceSchemas.create, {
        userId: validUserId,
        subjectId,
        hoursMissed,
        justified,
      });

      return this.db.absence.create({
        data,
        select: ABSENCE_SELECT,
      });
    });
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<AbsenceWithSubjectDTO | null> {
    const absenceId = this.validate(absenceSchemas.id, id);
    const validUserId = this.validate(absenceSchemas.userId, userId);

    return this.execute(() =>
      this.db.absence.findUnique({
        where: { id: absenceId, userId: validUserId },
        select: ABSENCE_WITH_SUBJECT_SELECT,
      }),
    );
  }

  async listByUser(userId: string): Promise<AbsenceDTO[]> {
    const validUserId = this.validate(absenceSchemas.userId, userId);

    return this.execute(() =>
      this.db.absence.findMany({
        where: { userId: validUserId },
        select: ABSENCE_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async listBySubject(subjectId: string, userId: string): Promise<AbsenceDTO[]> {
    const validSubjectId = this.validate(absenceSchemas.subjectId, subjectId);
    const validUserId = this.validate(absenceSchemas.userId, userId);

    return this.execute(() =>
      this.db.absence.findMany({
        where: { subjectId: validSubjectId, userId: validUserId },
        select: ABSENCE_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async update(
    id: string,
    userId: string,
    input: UpdateAbsenceInput,
  ): Promise<AbsenceDTO> {
    const absenceId = this.validate(absenceSchemas.id, id);
    const validUserId = this.validate(absenceSchemas.userId, userId);
    const data = this.validate(absenceSchemas.update, input);

    return this.execute(async () => {
      if (data.subjectId !== undefined) {
        await this.ensureOwnedSubject(data.subjectId, validUserId);
      }

      return this.db.absence.update({
        where: { id: absenceId, userId: validUserId },
        data,
        select: ABSENCE_SELECT,
      });
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const absenceId = this.validate(absenceSchemas.id, id);
    const validUserId = this.validate(absenceSchemas.userId, userId);

    await this.execute(() =>
      this.db.absence.delete({
        where: { id: absenceId, userId: validUserId },
      }),
    );
  }
}

export const absenceDal = new AbsenceDAL();

