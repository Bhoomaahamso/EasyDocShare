/*
  Warnings:

  - Changed the type of `required` on the `Field` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Field" DROP COLUMN "required",
ADD COLUMN     "required" BOOLEAN NOT NULL;
