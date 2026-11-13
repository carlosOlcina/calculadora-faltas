import { NextResponse } from 'next/server';
import { subjectDal } from '@/lib/server/dal';
import { parseJsonBody, protectedRoute } from '@/lib/server/route-helpers';
import { parseOrThrow, subjectSchemas } from '@/lib/server/schemas';

export const GET = protectedRoute(
  'GET /api/subjects',
  async (_request, userId) => {
    const subjects = await subjectDal.listByUser(userId);
    return NextResponse.json({ subjects }, { status: 200 });
  },
);

export const POST = protectedRoute(
  'POST /api/subjects',
  async (request, userId) => {
    const body = await parseJsonBody(request);
    const input = parseOrThrow(subjectSchemas.createBody, body);

    const subject = await subjectDal.create(userId, input);
    return NextResponse.json({ subject }, { status: 201 });
  },
);

