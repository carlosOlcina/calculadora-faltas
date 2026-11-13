import { NextResponse } from 'next/server';
import { courseDal } from '@/lib/server/dal';
import { protectedRoute } from '@/lib/server/route-helpers';

export const GET = protectedRoute(
  'GET /api/courses',
  async () => {
    const courses = await courseDal.listAll();
    return NextResponse.json({ courses }, { status: 200 });
  },
);
