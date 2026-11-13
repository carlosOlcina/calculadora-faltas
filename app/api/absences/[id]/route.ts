import { NextResponse } from 'next/server';
import { NotFoundError, absenceDal } from '@/lib/server/dal';
import { parseJsonBody, protectedRoute } from '@/lib/server/route-helpers';
import { absenceSchemas, parseOrThrow } from '@/lib/server/schemas';

type AbsenceRouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = protectedRoute<AbsenceRouteContext>(
  'GET /api/absences/[id]',
  async (_request, userId, context) => {
    const { id } = await context.params;
    const absence = await absenceDal.findById(id, userId);

    if (!absence) {
      throw new NotFoundError('No se encontró la falta solicitada.');
    }

    return NextResponse.json({ absence }, { status: 200 });
  },
);

export const PATCH = protectedRoute<AbsenceRouteContext>(
  'PATCH /api/absences/[id]',
  async (request, userId, context) => {
    const { id } = await context.params;
    const absenceId = parseOrThrow(absenceSchemas.id, id);
    const body = await parseJsonBody(request);
    const input = parseOrThrow(absenceSchemas.update, body);

    const absence = await absenceDal.update(absenceId, userId, input);
    return NextResponse.json({ absence }, { status: 200 });
  },
);

export const DELETE = protectedRoute<AbsenceRouteContext>(
  'DELETE /api/absences/[id]',
  async (_request, userId, context) => {
    const { id } = await context.params;
    await absenceDal.delete(id, userId);

    return NextResponse.json({ ok: true }, { status: 200 });
  },
);

