var AuthController = {}
var ResponseController = require('../Controllers/ResponseController');

AuthController.authenticate = async function(req, res, next) {
  next();
}

module.exports = AuthController;
