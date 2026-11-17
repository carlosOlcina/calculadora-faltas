import { NextResponse } from 'next/server';
import { subjectDal } from '@/lib/server/dal';
import { protectedRoute } from '@/lib/server/route-helpers';

type SubjectConvalidateRouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = protectedRoute<SubjectConvalidateRouteContext>(
  'GET /api/subjects/[id]/convalidate',
  async (_request, userId, context) => {
    const { id } = await context.params;
    const convalidatedSubject = await subjectDal.getConvalidation(id, userId);

    return NextResponse.json(
      {
        convalidate: convalidatedSubject !== null,
        convalidatedSubject,
      },
      { status: 200 },
    );
  },
);

export const POST = protectedRoute<SubjectConvalidateRouteContext>(
  'POST /api/subjects/[id]/convalidate',
  async (_request, userId, context) => {
    const { id } = await context.params;
    const convalidatedSubject = await subjectDal.convalidate(id, userId);

    return NextResponse.json(
      {
        convalidate: true,
        convalidatedSubject,
      },
      { status: 201 },
    );
  },
);

export const DELETE = protectedRoute<SubjectConvalidateRouteContext>(
  'DELETE /api/subjects/[id]/convalidate',
  async (_request, userId, context) => {
    const { id } = await context.params;
    await subjectDal.unconvalidate(id, userId);

    return NextResponse.json(
      {
        ok: true,
        convalidate: false,
      },
      { status: 200 },
    );
  },
);
