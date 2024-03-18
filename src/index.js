require('dotenv').config();
const express = require("express");
const apiRoutes = require("./api");
const { runServicesInSequence, runUpdates } = require("./utils/serviceRunner");

const startFotogramasReviewService = require("./services/FotogramasService").startFotogramasReviewService;
const startRogerEbertReviewService = require("./services/RogerEbertService").startRogerEbertReviewService;
const startMartinCidReviewService = require("./services/MartinCidService").startMartinCidReviewService;
const startSeriementeReviewService = require("./services/SeriementeService").startSeriementeReviewService;
const startEspinofPeliculaService = require("./services/EspinofPeliculasService").startEspinofPeliculaService;
const startElSeptimoArteReviewService = require("./services/ElSeptimoArteService").startElSeptimoArteReviewService;
const dailyUpdate = require("./services/dailyUpdateService").dailyUpdate;
const yearlyUpdate = require("./services/YearlyUpdateService").yearlyUpdate;

const app = express();

app.use("/api", apiRoutes);

const services = [
  { name: 'EspinofPeliculaService', service: startEspinofPeliculaService },
  { name: 'FotogramasReviewService', service: startFotogramasReviewService },
  { name: 'RogerEbertReviewService', service: startRogerEbertReviewService },
  { name: 'MartinCidReviewService', service: startMartinCidReviewService },
  { name: 'SeriementeReviewService', service: startSeriementeReviewService },
  { name: 'ElSeptimoArteReviewService', service: startElSeptimoArteReviewService },
  // Agrega otros servicios según sea necesario...
];

const updates = [
  { name: 'DailyUpdate', service: dailyUpdate, isDaily: true },
  { name: 'YearlyUpdate', service: yearlyUpdate, isDaily: false },
  // Agrega otras actualizaciones según sea necesario...
];

const port = process.env.PORT || 8000;
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  
  // Inicia la secuencia de servicios
  await runServicesInSequence(services);
  
  // Inicia las actualizaciones
  updates.forEach(update => {
    runUpdates(update.service, update.name, update.isDaily);
  });
});

module.exports = app;
