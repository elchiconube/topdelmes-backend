const express = require("express");
const apiController = require("../controllers/apiController");

const router = express.Router();

router.get("/top/:title_type/:year?/:month?", apiController.handleTopRequest);

module.exports = router;
