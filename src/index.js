const express = require("express");
const apiRoutes = require("./api");
// const {
//   startRogerEbertReviewService,
// } = require("./services/RogerEbertService");

const app = express();

app.use("/api", apiRoutes);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// startRogerEbertReviewService();

module.exports = app;
