-- CreateTable
CREATE TABLE "subject_indices" (
    "user_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "index" DECIMAL(10,1) NOT NULL,

    CONSTRAINT "subject_indices_pkey" PRIMARY KEY ("user_id","subject_id")
);

-- CreateIndex
CREATE INDEX "subject_indices_user_id_idx" ON "subject_indices"("user_id");

-- CreateIndex
CREATE INDEX "subject_indices_subject_id_idx" ON "subject_indices"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_indices_user_id_index_key" ON "subject_indices"("user_id", "index");

-- AddForeignKey
ALTER TABLE "subject_indices" ADD CONSTRAINT "subject_indices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_indices" ADD CONSTRAINT "subject_indices_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "asignaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
