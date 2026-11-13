import { NextResponse } from 'next/server';
import { NotFoundError, subjectDal } from '@/lib/server/dal';
import { parseJsonBody, protectedRoute } from '@/lib/server/route-helpers';
import { parseOrThrow, subjectSchemas } from '@/lib/server/schemas';

type SubjectRouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = protectedRoute<SubjectRouteContext>(
  'GET /api/subjects/[id]',
  async (_request, userId, context) => {
    const { id } = await context.params;
    const subject = await subjectDal.findById(id, userId);

    if (!subject) {
      throw new NotFoundError('No se encontró la asignatura solicitada.');
    }

    return NextResponse.json({ subject }, { status: 200 });
  },
);

export const PATCH = protectedRoute<SubjectRouteContext>(
  'PATCH /api/subjects/[id]',
  async (request, userId, context) => {
    const { id } = await context.params;
    const subjectId = parseOrThrow(subjectSchemas.id, id);
    const body = await parseJsonBody(request);
    const input = parseOrThrow(subjectSchemas.update, body);

    const subject = await subjectDal.update(subjectId, userId, input);
    return NextResponse.json({ subject }, { status: 200 });
  },
);

export const DELETE = protectedRoute<SubjectRouteContext>(
  'DELETE /api/subjects/[id]',
  async (_request, userId, context) => {
    const { id } = await context.params;
    await subjectDal.delete(id, userId);

    return NextResponse.json({ ok: true }, { status: 200 });
  },
);

