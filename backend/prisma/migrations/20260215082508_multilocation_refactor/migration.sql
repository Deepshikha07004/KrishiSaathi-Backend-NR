/*
  Warnings:

  - You are about to drop the column `address` on the `farmers` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `farmers` table. All the data in the column will be lost.
  - You are about to drop the column `district` on the `farmers` table. All the data in the column will be lost.
  - You are about to drop the column `isLocationConfirmed` on the `farmers` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `farmers` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `farmers` table. All the data in the column will be lost.
  - You are about to drop the column `pincode` on the `farmers` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `farmers` table. All the data in the column will be lost.
  - You are about to drop the column `village` on the `farmers` table. All the data in the column will be lost.
  - You are about to drop the column `farmerId` on the `weather_data` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `weather_data` table. All the data in the column will be lost.
  - You are about to drop the column `locationName` on the `weather_data` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `weather_data` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `weather_forecast` table. All the data in the column will be lost.
  - You are about to drop the column `locationName` on the `weather_forecast` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `weather_forecast` table. All the data in the column will be lost.
  - Added the required column `locationId` to the `chat_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationId` to the `farmer_crops` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationId` to the `weather_data` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationId` to the `weather_forecast` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "weather_data" DROP CONSTRAINT "weather_data_farmerId_fkey";

-- DropIndex
DROP INDEX "weather_data_farmerId_idx";

-- DropIndex
DROP INDEX "weather_forecast_date_latitude_longitude_idx";

-- AlterTable
ALTER TABLE "chat_history" ADD COLUMN     "locationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "farmer_crops" ADD COLUMN     "locationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "farmers" DROP COLUMN "address",
DROP COLUMN "city",
DROP COLUMN "district",
DROP COLUMN "isLocationConfirmed",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "pincode",
DROP COLUMN "state",
DROP COLUMN "village";

-- AlterTable
ALTER TABLE "weather_data" DROP COLUMN "farmerId",
DROP COLUMN "latitude",
DROP COLUMN "locationName",
DROP COLUMN "longitude",
ADD COLUMN     "locationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "weather_forecast" DROP COLUMN "latitude",
DROP COLUMN "locationName",
DROP COLUMN "longitude",
ADD COLUMN     "locationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "farmer_locations" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "village" TEXT,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farmer_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "weather_data_locationId_idx" ON "weather_data"("locationId");

-- CreateIndex
CREATE INDEX "weather_forecast_locationId_date_idx" ON "weather_forecast"("locationId", "date");

-- AddForeignKey
ALTER TABLE "farmer_locations" ADD CONSTRAINT "farmer_locations_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_data" ADD CONSTRAINT "weather_data_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "farmer_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_forecast" ADD CONSTRAINT "weather_forecast_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "farmer_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_crops" ADD CONSTRAINT "farmer_crops_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "farmer_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "farmer_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
