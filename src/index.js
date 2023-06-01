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
  console.log(`Waiting for ${msToTime(delay)} before starting next update.`);
  setTimeout(runDailyUpdate, delay);
};

// startScrapingService();
// startRogerEbertReviewService();
// startMartinCidReviewService();
// startSeriementeReviewService();
// startEspinofPeliculaService();

const urls = [
  "https://cinemagavia.es/el-tesoro-de-sierra-madre-pelicula-critica-estreno/",
  "https://cinemagavia.es/tu-y-yo-pelicula-critica-estreno-cine/",
  "https://cinemagavia.es/teresa-raquin-pelicula-critica/",
  "https://cinemagavia.es/el-defensor-publico-pelicula-critica-estreno-cine/",
  "https://cinemagavia.es/todos-a-casa-pelicula-critica/",
  "https://cinemagavia.es/el-ladron-de-cadaveres-pelicula-critica/",
  "https://cinemagavia.es/pinocho-1940-pelicula-critica/",
  "https://cinemagavia.es/el-enigma-de-otro-mundo-pelicula-critica/",
  "https://cinemagavia.es/mariona-rebull-pelicula-critica/",
  "https://cinemagavia.es/el-beso-mortal-pelicula-critica/",
  "https://cinemagavia.es/los-invasores-de-otros-mundos-pelicula-critica/",
  "https://cinemagavia.es/el-callejon-de-las-almas-perdidas-1947pelicula-critica/",
  "https://cinemagavia.es/el-halcon-maltes-pelicula-critica/",
  "https://cinemagavia.es/rebelde-sin-causa-pelicula-critica/",
  "https://cinemagavia.es/la-vida-por-delante-pelicula-critica-fernando-fernan-gomez/",
  "https://cinemagavia.es/la-soga-pelicula-critica/",
  "https://cinemagavia.es/el-rastro-de-la-pantera-pelicula-critica/",
  "https://cinemagavia.es/la-carreta-fantasma-pelicula-libro-critica/",
  "https://cinemagavia.es/al-morir-la-noche-pelicula-critica/",
  "https://cinemagavia.es/ataque-pelicula-critica-aldrich/",
  "https://cinemagavia.es/un-lugar-en-la-cumbre-critica-pelicula/",
  "https://cinemagavia.es/la-jungla-de-asfalto-critica-pelicula/",
  "https://cinemagavia.es/cagliostro-pelicula-critica-orson-welles/",
  "https://cinemagavia.es/cinco-tumbas-al-cairo-pelicula-critica/",
  "https://cinemagavia.es/voces-de-muerte-pelicula-critica/",
  "https://cinemagavia.es/el-chico-pelicula-critica-chaplin/",
  "https://cinemagavia.es/godzilla-japon-bajo-terror-monstruo-pelicula-critica/",
  "https://cinemagavia.es/la-torre-de-los-sietes-jorobados-pelicula-critica/",
  "https://cinemagavia.es/mision-valientes-the-dam-buster-pelicula-critica/",
  "https://cinemagavia.es/cuando-pasan-las-ciguenas-pelicula-critica/",
  "https://cinemagavia.es/rebecca-rebeca-1940-critica-pelicula/",
  "https://cinemagavia.es/gabinete-doctor-caligari-pelicula-critica/",
  "https://cinemagavia.es/la-legion-negra-critica-pelicula/",
  "https://cinemagavia.es/el-gran-carnaval-pelicula-critica/",
  "https://cinemagavia.es/medianoche-pelicula-critica/",
  "https://cinemagavia.es/alicia-pais-maravillas-la-magia-1951-disney-pelicula-critica/",
  "https://cinemagavia.es/ultimo-refugio-pelicula-critica/",
  "https://cinemagavia.es/roma-ciudad-abierta-critica-pelicula/",
  "https://cinemagavia.es/fresas-salvajes-pelicula-critica/",
  "https://cinemagavia.es/solo-ante-el-peligro-pelicula-critica/",
  "https://cinemagavia.es/rififi-pelicula-critica/",
  "https://cinemagavia.es/dos-monjes-pelicula-critica/",
  "https://cinemagavia.es/valeroso-soldado-svejk-pelicula-critica/",
  "https://cinemagavia.es/placer-pelicula-critica-ophuls/",
  "https://cinemagavia.es/repente-ultimo-verano-pelicula-critica/",
  "https://cinemagavia.es/noches-cabiria-pelicula-critica-fellini/",
  "https://cinemagavia.es/crimen-calle-bordadores-pelicula-critica-neville/",
  "https://cinemagavia.es/easy-virtue-vida-alegre-critica-pelicula/",
  "https://cinemagavia.es/chantaje-broadway-pelicula-critica/",
  "https://cinemagavia.es/cuarto-mandamiento-pelicula-critica/",
  "https://cinemagavia.es/mago-oz-pelicula-critica-musical/",
  "https://cinemagavia.es/el-cochecito-pelicula-critica/",
  "https://cinemagavia.es/muerte-de-un-ciclista-nadie-pelicula-critica/",
  "https://cinemagavia.es/el-hombre-de-la-camara-pelicula-critica/",
  "https://cinemagavia.es/un-verano-con-monica-pelicula-critica/",
  "https://cinemagavia.es/scarface-el-terror-del-hampa-critica-pelicula/",
  "https://cinemagavia.es/marty-pelicula-critica/",
  "https://cinemagavia.es/el-crepusculo-de-los-dioses-pelicula-critica-wilder/",
  "https://cinemagavia.es/la-pasion-de-juana-de-arco-pelicula-critica-dreyer/",
  "https://cinemagavia.es/cautivos-del-mal-critica-pelicula/",
  "https://cinemagavia.es/extranos-en-un-tren-pelicula-critica/",
  "https://cinemagavia.es/pickpocket-pelicula-critica-bresson/",
];

startProcessingUrls(urls);

runDailyUpdate();
runServicesInSequence();

module.exports = app;
