import { NextResponse } from 'next/server';
import { courseDal } from '@/lib/server/dal';
import { parseJsonBody, protectedRoute } from '@/lib/server/route-helpers';
import { courseSchemas, parseOrThrow } from '@/lib/server/schemas';

export const GET = protectedRoute(
  'GET /api/courses',
  async () => {
    const courses = await courseDal.listAll();
    return NextResponse.json({ courses }, { status: 200 });
  },
);
