-- CreateTable
CREATE TABLE "convalidate_subjects" (
    "user_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,

    CONSTRAINT "convalidate_subjects_pkey" PRIMARY KEY ("user_id","subject_id")
);

-- CreateIndex
CREATE INDEX "convalidate_subjects_user_id_idx" ON "convalidate_subjects"("user_id");

-- CreateIndex
CREATE INDEX "convalidate_subjects_subject_id_idx" ON "convalidate_subjects"("subject_id");

-- AddForeignKey
ALTER TABLE "convalidate_subjects" ADD CONSTRAINT "convalidate_subjects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convalidate_subjects" ADD CONSTRAINT "convalidate_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "asignaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
