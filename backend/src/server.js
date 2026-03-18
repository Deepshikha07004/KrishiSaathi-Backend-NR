// Import required packages
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Initialize Express app
const app = express();


// ===============================
// MIDDLEWARE
// ===============================
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies



// ===============================
// ROUTES IMPORT
// ===============================
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const cropRoutes = require('./routes/crop.routes');
const chatRoutes = require('./routes/chat.routes');
const locationRoutes = require('./routes/location.routes');
const weatherRoutes = require('./routes/weather.routes');
const advisoryRoutes = require('./routes/advisory.routes');


// ===============================
// BASIC ROUTES
// ===============================

// Root test route
app.get('/', (req, res) => {
  res.json({
    message: 'KrishiSaathi API 🌾',
    version: '1.0.0',
    status: 'active'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});



// ===============================
// API ROUTES
// ===============================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/advisory', advisoryRoutes);


// ===============================
// GLOBAL ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.error("Global Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});


// ===============================
// 404 HANDLER
// ===============================
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// ===============================
// SEED PLACEHOLDER CROP DATA
// Runs once on server start — creates a placeholder CropMaster
// so FarmerCrop can be saved without real ML data.
// Replace with real crop data when ML teammate provides dataset.
// ===============================

const prisma = require('./config/prisma');

const PLACEHOLDER_CROPS = [
  { id: 'crop-rice',   cropNameEn: 'Rice',   cropNameHi: 'चावल',  cropNameBn: 'ধান',   waterRequirement: 'HIGH',   suitableClimate: 'MONSOON',    growingDurationDays: 120 },
  { id: 'crop-wheat',  cropNameEn: 'Wheat',  cropNameHi: 'गेहूं', cropNameBn: 'গম',    waterRequirement: 'MEDIUM', suitableClimate: 'WINTER',     growingDurationDays: 120 },
  { id: 'crop-maize',  cropNameEn: 'Maize',  cropNameHi: 'मक्का', cropNameBn: 'ভুট্টা',waterRequirement: 'MEDIUM', suitableClimate: 'SUMMER',     growingDurationDays: 90  },
  { id: 'crop-cotton', cropNameEn: 'Cotton', cropNameHi: 'कपास',  cropNameBn: 'তুলা',  waterRequirement: 'LOW',    suitableClimate: 'SUMMER',     growingDurationDays: 180 },
  { id: 'crop-potato', cropNameEn: 'Potato', cropNameHi: 'आलू',   cropNameBn: 'আলু',   waterRequirement: 'MEDIUM', suitableClimate: 'WINTER',     growingDurationDays: 90  },
  { id: 'crop-tomato', cropNameEn: 'Tomato', cropNameHi: 'टमाटर', cropNameBn: 'টমেটো', waterRequirement: 'MEDIUM', suitableClimate: 'ALL_SEASON', growingDurationDays: 75  },
  { id: 'crop-onion',  cropNameEn: 'Onion',  cropNameHi: 'प्याज', cropNameBn: 'পেঁয়াজ',waterRequirement: 'LOW',   suitableClimate: 'WINTER',     growingDurationDays: 120 },
  { id: 'crop-jute',   cropNameEn: 'Jute',   cropNameHi: 'जूट',   cropNameBn: 'পাট',   waterRequirement: 'HIGH',   suitableClimate: 'MONSOON',    growingDurationDays: 120 },
];

const seedPlaceholderCrops = async () => {
  try {
    for (const crop of PLACEHOLDER_CROPS) {
      await prisma.cropMaster.upsert({
        where: { id: crop.id },
        update: {},
        create: crop,
      });
    }
    console.log('✅ CropMaster seeded with placeholder crops');
  } catch (err) {
    console.error('CropMaster seed error:', err.message);
  }
};

// Call after app.listen
seedPlaceholderCrops();


// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  await seedPlaceholderCrops();
});