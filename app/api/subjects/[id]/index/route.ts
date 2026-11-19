import { NextResponse } from 'next/server';
import { subjectDal } from '@/lib/server/dal';
import { parseJsonBody, protectedRoute } from '@/lib/server/route-helpers';
import { parseOrThrow, subjectSchemas } from '@/lib/server/schemas';

type SubjectIndexRouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = protectedRoute<SubjectIndexRouteContext>(
  'GET /api/subjects/[id]/index',
  async (_request, userId, context) => {
    const { id } = await context.params;
    const subjectIndex = await subjectDal.getIndex(id, userId);

    return NextResponse.json(
      {
        index: subjectIndex?.index ?? null,
        subjectIndex,
      },
      { status: 200 },
    );
  },
);

export const POST = protectedRoute<SubjectIndexRouteContext>(
  'POST /api/subjects/[id]/index',
  async (request, userId, context) => {
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const input = parseOrThrow(subjectSchemas.setIndexBody, body);
    const result = await subjectDal.setIndex(id, userId, input.index);

    return NextResponse.json(
      {
        index: result.index,
        reindexed: result.reindexed,
        subjectIndex: result.subjectIndex,
        indices: result.indices,
      },
      { status: result.created ? 201 : 200 },
    );
  },
);
