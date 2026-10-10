const express = require('express'); 
const router = express.Router();
const { createFolder, getFolders } = require('../controllers/folderController'); 
const authMiddleware = require("../middleware/authMiddleware");
router.post('/', authMiddleware, createFolder);
router.get('/', authMiddleware,  getFolders);
module.exports = router; 