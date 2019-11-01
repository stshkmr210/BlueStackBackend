var express = require('express');
var router = express.Router();

const ScrapController = require('../Controllers/ScrapController');
const AuthController = require('../Controllers/AuthController');

router.get('/re-scrap', AuthController.authenticate, ScrapController.reScrap);
router.get('/get-detailed-data', AuthController.authenticate, ScrapController.getDetailedData);
router.get('/top', AuthController.authenticate, ScrapController.top);


module.exports = router;