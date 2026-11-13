import { NextResponse } from 'next/server';
import { absenceDal } from '@/lib/server/dal';
import { parseJsonBody, protectedRoute } from '@/lib/server/route-helpers';
import { absenceSchemas, parseOrThrow } from '@/lib/server/schemas';

export const GET = protectedRoute(
  'GET /api/absences',
  async (request, userId) => {
    const rawSubjectId = request.nextUrl.searchParams.get('subjectId');

    if (rawSubjectId !== null) {
      const subjectId = parseOrThrow(absenceSchemas.subjectId, rawSubjectId);
      const absences = await absenceDal.listBySubject(subjectId, userId);
      return NextResponse.json({ absences }, { status: 200 });
    }

    const absences = await absenceDal.listByUser(userId);
    return NextResponse.json({ absences }, { status: 200 });
  },
);

export const POST = protectedRoute(
  'POST /api/absences',
  async (request, userId) => {
    const body = await parseJsonBody(request);
    const input = parseOrThrow(absenceSchemas.createBody, body);

    const absence = await absenceDal.create(userId, input);
    return NextResponse.json({ absence }, { status: 201 });
  },
);

