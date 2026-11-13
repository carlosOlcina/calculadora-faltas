-- DropIndex
DROP INDEX "asignaturas_curso_id_nombre_key";

-- AlterTable
ALTER TABLE "asignaturas" ADD COLUMN     "user_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "faltas" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "horas_faltadas" INTEGER NOT NULL,
    "justificada" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faltas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jwt" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "jwt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faltas_user_id_idx" ON "faltas"("user_id");

-- CreateIndex
CREATE INDEX "faltas_subject_id_user_id_idx" ON "faltas"("subject_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "jwt_token_key" ON "jwt"("token");

-- CreateIndex
CREATE INDEX "jwt_user_id_idx" ON "jwt"("user_id");

-- CreateIndex
CREATE INDEX "asignaturas_user_id_idx" ON "asignaturas"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "asignaturas_user_id_nombre_key" ON "asignaturas"("user_id", "nombre");

-- AddForeignKey
ALTER TABLE "asignaturas" ADD CONSTRAINT "asignaturas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faltas" ADD CONSTRAINT "faltas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faltas" ADD CONSTRAINT "faltas_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "asignaturas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jwt" ADD CONSTRAINT "jwt_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
