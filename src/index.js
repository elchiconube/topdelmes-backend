const express = require("express");
const apiRoutes = require("./api");
const {
  startRogerEbertReviewService,
} = require("./services/RogerEbertService");

const app = express();

app.use("/api", apiRoutes);

app.listen(4000, () => {
  console.log("Server listening on port 4000");
});

startRogerEbertReviewService();
