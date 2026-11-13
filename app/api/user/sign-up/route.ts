import { NextResponse } from 'next/server';
import { ServerError, userDal } from '@/lib/server/dal';
import { parseOrThrow, userSchemas } from '@/lib/server/schemas';

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'El cuerpo de la petición debe ser un JSON válido', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const input = parseOrThrow(userSchemas.create, body);

    const existingUser = await userDal.findByName(input.name);
    if (existingUser) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya existe', code: 'UNIQUE_CONSTRAINT' },
        { status: 409 },
      );
    }

    const user = await userDal.create(input);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof ServerError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }

    console.error('Error en POST /api/user/sign-up:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', code: 'INTERNAL_SERVER_ERROR' },
      { status: 500 },
    );
  }
}

