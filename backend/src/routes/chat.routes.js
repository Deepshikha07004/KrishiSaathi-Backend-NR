const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth.middleware');
const { advisoryChat, getChatHistory } = require('../controllers/chat.controller');

// 🤖 Advisory Chat
router.post('/advisory', protect, advisoryChat);

// Chat History
router.get('/history', protect, getChatHistory);

module.exports = router;
