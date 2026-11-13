import { NextResponse } from 'next/server';
import { NotFoundError, courseDal } from '@/lib/server/dal';
import { protectedRoute } from '@/lib/server/route-helpers';

type CourseRouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = protectedRoute<CourseRouteContext>(
  'GET /api/courses/[id]',
  async (_request, _userId, context) => {
    const { id } = await context.params;
    const course = await courseDal.findById(id);

    if (!course) {
      throw new NotFoundError('No se encontró el curso solicitado.');
    }

    return NextResponse.json({ course }, { status: 200 });
  },
);