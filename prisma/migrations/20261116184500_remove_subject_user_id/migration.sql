-- DropForeignKey
ALTER TABLE "asignaturas" DROP CONSTRAINT "asignaturas_user_id_fkey";

-- DropIndex
DROP INDEX "asignaturas_user_id_idx";

-- DropIndex
DROP INDEX "asignaturas_user_id_nombre_key";

-- AlterTable
ALTER TABLE "asignaturas" DROP COLUMN "user_id";

-- CreateIndex
CREATE UNIQUE INDEX "asignaturas_curso_id_nombre_key" ON "asignaturas"("curso_id", "nombre");
