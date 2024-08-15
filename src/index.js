require('dotenv').config();
const express = require("express");
const apiRoutes = require("./api");
const { runServicesInSequence } = require("./utils/serviceRunner");
const cron = require('node-cron');

const startFotogramasReviewService = require("./services/FotogramasService").startFotogramasReviewService;
const startRogerEbertReviewService = require("./services/RogerEbertService").startRogerEbertReviewService;
const startSeriementeReviewService = require("./services/SeriementeService").startSeriementeReviewService;
const startElTeleviseroService = require("./services/ElTeleviseroService").startElTeleviseroService;
const startEspinofPeliculasService = require("./services/EspinofPeliculasService").startEspinofPeliculasService;
const startVarietyService = require("./services/VarietyService").startVarietyService;
const startBlogCineEspanolService = require("./services/BlogCineEspanolService").startBlogCineEspanolService;
const { dailyUpdate } = require("./services/dailyUpdateService");
const { yearlyUpdate } = require("./services/YearlyUpdateService");

const app = express();

app.use("/api", apiRoutes);

const services = [
  { name: 'ElTeleviseroService', service: startElTeleviseroService },
  { name: 'EspinofPeliculasService', service: startEspinofPeliculasService },
  { name: 'VarietyService', service: startVarietyService },
  { name: 'FotogramasReviewService', service: startFotogramasReviewService },
  { name: 'BlogCineEspanolService', service: startBlogCineEspanolService },
  { name: 'RogerEbertReviewService', service: startRogerEbertReviewService },
  { name: 'SeriementeReviewService', service: startSeriementeReviewService },
];

let isUpdating = false;

const runUpdate = async (updateFunction, updateName) => {
  if (isUpdating) {
    console.log(`${updateName} skipped - another update is in progress`);
    return;
  }

  isUpdating = true;
  console.log(`Starting ${updateName}...`);

  try {
    await updateFunction();
    console.log(`${updateName} completed successfully`);
  } catch (error) {
    console.error(`Error in ${updateName}:`, error);
  } finally {
    isUpdating = false;
  }
};

const runDailyUpdates = async () => {
  // await runUpdate(dailyUpdate, 'Daily Update');
  await runUpdate(yearlyUpdate, 'Yearly Update');
};

const port = process.env.PORT || 8000;
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);

  // Inicia la secuencia de servicios
  await runServicesInSequence(services);

  // Configura la actualización diaria
  // Se ejecuta todos los días a las 00:00
  cron.schedule('0 0 * * *', runDailyUpdates);

  // Ejecuta las actualizaciones al iniciar el servidor
  runDailyUpdates();
});

module.exports = app;