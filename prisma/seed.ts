import { loadEnvConfig } from '@next/env';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

loadEnvConfig(process.cwd());

const INITIAL_COURSES = [
  {
    name: '1º DAW · Desarrollo de Aplicaciones Web',
    totalHours: 960,
  },
  {
    name: '2º DAW · Desarrollo de Aplicaciones Web',
    totalHours: 1040,
  },
  {
    name: '1º DAM · Desarrollo de Aplicaciones Multiplataforma',
    totalHours: 960,
  },
  {
    name: '2º DAM · Desarrollo de Aplicaciones Multiplataforma',
    totalHours: 1040,
  },
  {
    name: '1º ASIR · Administración de Sistemas Informáticos en Red',
    totalHours: 960,
  },
  {
    name: '2º ASIR · Administración de Sistemas Informáticos en Red',
    totalHours: 1040,
  },
  {
    name: '1º SMR · Sistemas Microinformáticos y Redes',
    totalHours: 960,
  },
  {
    name: '2º SMR · Sistemas Microinformáticos y Redes',
    totalHours: 1040,
  },
  {
    name: '1º Bachillerato · Ciencias y Tecnología',
    totalHours: 960,
  },
  {
    name: '2º Bachillerato · Ciencias y Tecnología',
    totalHours: 960,
  },
] as const;

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada para ejecutar el seed.');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    for (const course of INITIAL_COURSES) {
      await prisma.course.upsert({
        where: { name: course.name },
        update: { totalHours: course.totalHours },
        create: {
          name: course.name,
          totalHours: course.totalHours,
        },
      });
    }

    console.log(`Seed completado: ${INITIAL_COURSES.length} cursos sincronizados.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Error ejecutando el seed de cursos:', error);
  process.exitCode = 1;
});

