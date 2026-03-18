-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ENGLISH', 'BENGALI', 'HINDI');

-- CreateEnum
CREATE TYPE "Climate" AS ENUM ('SUMMER', 'WINTER', 'MONSOON', 'ALL_SEASON');

-- CreateEnum
CREATE TYPE "WaterRequirement" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CropStatus" AS ENUM ('SOWING', 'GROWING', 'HARVESTED');

-- CreateEnum
CREATE TYPE "WeatherCondition" AS ENUM ('CLEAR', 'RAIN', 'DROUGHT', 'HEATWAVE', 'COLD', 'STORM', 'CLOUDY');

-- CreateTable
CREATE TABLE "farmers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "preferredLanguage" "Language" NOT NULL DEFAULT 'ENGLISH',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "village" TEXT,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "isLocationConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_data" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "feelsLike" DOUBLE PRECISION NOT NULL,
    "humidity" INTEGER NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "weatherMain" TEXT NOT NULL,
    "weatherDesc" TEXT NOT NULL,
    "weatherIcon" TEXT NOT NULL,
    "pressure" INTEGER,
    "visibility" INTEGER,
    "cloudiness" INTEGER,
    "sunrise" TIMESTAMP(3),
    "sunset" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationName" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_forecast" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tempMin" DOUBLE PRECISION NOT NULL,
    "tempMax" DOUBLE PRECISION NOT NULL,
    "weatherMain" TEXT NOT NULL,
    "weatherDesc" TEXT NOT NULL,
    "weatherIcon" TEXT NOT NULL,
    "humidity" INTEGER NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "chanceOfRain" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationName" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crops_master" (
    "id" TEXT NOT NULL,
    "cropNameEn" TEXT NOT NULL,
    "cropNameHi" TEXT,
    "cropNameBn" TEXT,
    "suitableClimate" "Climate" NOT NULL,
    "waterRequirement" "WaterRequirement" NOT NULL,
    "growingDurationDays" INTEGER NOT NULL,
    "descriptionEn" TEXT,
    "descriptionHi" TEXT,
    "descriptionBn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crops_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmer_crops" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "sowingDate" TIMESTAMP(3) NOT NULL,
    "expectedHarvestDate" TIMESTAMP(3),
    "status" "CropStatus" NOT NULL DEFAULT 'GROWING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farmer_crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_precautions" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "weatherCondition" "WeatherCondition" NOT NULL,
    "precautionTextEn" TEXT NOT NULL,
    "precautionTextHi" TEXT,
    "precautionTextBn" TEXT,

    CONSTRAINT "weather_precautions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_history" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "messageLanguage" "Language" NOT NULL,
    "isFarmerMessage" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmer_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessed" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "farmers_phoneNumber_key" ON "farmers"("phoneNumber");

-- CreateIndex
CREATE INDEX "weather_data_farmerId_idx" ON "weather_data"("farmerId");

-- CreateIndex
CREATE INDEX "weather_forecast_date_latitude_longitude_idx" ON "weather_forecast"("date", "latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "farmer_sessions_sessionId_key" ON "farmer_sessions"("sessionId");

-- AddForeignKey
ALTER TABLE "weather_data" ADD CONSTRAINT "weather_data_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_crops" ADD CONSTRAINT "farmer_crops_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_crops" ADD CONSTRAINT "farmer_crops_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_precautions" ADD CONSTRAINT "weather_precautions_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_sessions" ADD CONSTRAINT "farmer_sessions_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
