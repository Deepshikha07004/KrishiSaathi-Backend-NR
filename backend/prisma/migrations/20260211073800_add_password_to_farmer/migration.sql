/*
  Warnings:

  - Added the required column `password` to the `farmers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "farmers" ADD COLUMN     "password" TEXT NOT NULL;
