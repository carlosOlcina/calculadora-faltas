-- CreateTable
CREATE TABLE "cursos" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "duracion_horas_total" INTEGER NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "curso_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaturas" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "horas" INTEGER NOT NULL,
    "curso_id" UUID NOT NULL,

    CONSTRAINT "asignaturas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cursos_nombre_key" ON "cursos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_nombre_key" ON "usuarios"("nombre");

-- CreateIndex
CREATE INDEX "usuarios_curso_id_idx" ON "usuarios"("curso_id");

-- CreateIndex
CREATE INDEX "asignaturas_curso_id_idx" ON "asignaturas"("curso_id");

-- CreateIndex
CREATE UNIQUE INDEX "asignaturas_curso_id_nombre_key" ON "asignaturas"("curso_id", "nombre");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaturas" ADD CONSTRAINT "asignaturas_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
