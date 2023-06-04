const express = require("express");
const apiRoutes = require("./api");
//const { startScrapingService } = require("./services/scrapingService");
const {
  startRogerEbertReviewService,
} = require("./services/RogerEbertService");
const { startMartinCidReviewService } = require("./services/MartinCidService");
const {
  startSeriementeReviewService,
} = require("./services/SeriementeService");
const { getRandomDelay, msToTime } = require("./utils/helper");
const { dailyUpdate } = require("./services/dailyUpdateService");
const { yearlyUpdate } = require("./services/YearlyUpdateService");
const {
  startEspinofPeliculaService,
} = require("./services/EspinofPeliculasService");
const { startProcessingUrls } = require("./services/CinemaGaviaClassicService");

const app = express();

app.use("/api", apiRoutes);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Reviews services
const runServicesInSequence = async () => {
  console.log("Starting RogerEbertReviewService...");
  await startRogerEbertReviewService();
  console.log("Finished RogerEbertReviewService.");

  const delay1 = getRandomDelay();
  console.log(`Waiting for ${msToTime(delay1)} before starting next service.`);
  setTimeout(async () => {
    console.log("Starting MartinCidReviewService...");
    await startMartinCidReviewService();
    console.log("Finished MartinCidReviewService.");

    const delay2 = getRandomDelay();
    console.log(
      `Waiting for ${msToTime(delay2)} before starting next service.`
    );
    setTimeout(async () => {
      console.log("Starting SeriementeReviewService...");
      await startSeriementeReviewService();
      console.log("Finished SeriementeReviewService.");

      const delay3 = getRandomDelay();
      console.log(
        `Waiting for ${msToTime(delay3)} before starting next service.`
      );
      setTimeout(async () => {
        console.log("Starting EspinofPeliculaService...");
        await startEspinofPeliculaService();
        console.log("Finished EspinofPeliculaService.");

        const delay4 = getRandomDelay();
        console.log(
          `Waiting for ${msToTime(delay4)} before starting next service.`
        );
        setTimeout(runServicesInSequence, delay4);
      }, delay3);
    }, delay2);
  }, delay1);
};

const runDailyUpdate = async () => {
  console.log("Starting daily update...");
  await dailyUpdate();
  console.log("Finished daily update.");

  const delay = getRandomDelay();
  console.log(
    `Waiting for ${msToTime(delay)} before starting next daily update.`
  );
  setTimeout(runDailyUpdate, delay);
};

const runYearlyUpdate = async () => {
  console.log("Starting yearly update...");
  await yearlyUpdate();
  console.log("Finished yearly update.");

  const delay = getRandomDelay(true);
  console.log(
    `Waiting for ${msToTime(delay)} before starting next yearly update.`
  );
  setTimeout(runYearlyUpdate, delay);
};

// startScrapingService();
// startRogerEbertReviewService();
// startMartinCidReviewService();
// startSeriementeReviewService();
// startEspinofPeliculaService();

//const urls = [];

//startProcessingUrls(urls);

runYearlyUpdate();
runDailyUpdate();
runServicesInSequence();

module.exports = app;
