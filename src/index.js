require('dotenv').config();
const express = require("express");
const apiRoutes = require("./api");
const { runServicesInSequence } = require("./utils/serviceRunner");
const cron = require('node-cron');

// Servicios de revisión
const services = {
  ElTelevisero: require("./services/ElTeleviseroService").startElTeleviseroService,
  EspinofPeliculas: require("./services/EspinofPeliculasService").startEspinofPeliculasService,
  Variety: require("./services/VarietyService").startVarietyService,
  Fotogramas: require("./services/FotogramasService").startFotogramasReviewService,
  BlogCineEspanol: require("./services/BlogCineEspanolService").startBlogCineEspanolService,
  RogerEbert: require("./services/RogerEbertService").startRogerEbertReviewService,
  Serialmente: require("./services/SeriementeService").startSeriementeReviewService,
};

// Servicios de actualización
const { dailyUpdate } = require("./services/dailyUpdateService");
const { yearlyUpdate } = require("./services/YearlyUpdateService");

const app = express();

// Middleware
app.use(express.json());
app.use("/api", apiRoutes);

// Control de actualizaciones concurrentes
const updateLock = {
  isUpdating: false,
  lastUpdate: null,
  currentOperation: null
};

const runUpdate = async (updateFunction, updateName) => {
  if (updateLock.isUpdating) {
    console.log(`${updateName} skipped - ${updateLock.currentOperation} is in progress since ${updateLock.lastUpdate}`);
    return;
  }

  updateLock.isUpdating = true;
  updateLock.lastUpdate = new Date().toISOString();
  updateLock.currentOperation = updateName;

  try {
    console.log(`Starting ${updateName} at ${updateLock.lastUpdate}`);
    await updateFunction();
    console.log(`${updateName} completed successfully at ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`Error in ${updateName}:`, error);
    // Notificar el error (aquí podrías agregar integración con un servicio de monitoreo)
  } finally {
    updateLock.isUpdating = false;
    updateLock.currentOperation = null;
  }
};

const runDailyUpdates = async () => {
  try {
    // Primero ejecutamos la actualización diaria
    await runUpdate(dailyUpdate, 'Daily Update');
    
    // Si la actualización diaria fue exitosa, ejecutamos la actualización anual
    if (!updateLock.isUpdating) {
      await runUpdate(yearlyUpdate, 'Yearly Update');
    }
  } catch (error) {
    console.error('Error in updates sequence:', error);
  }
};

const runReviewServices = async () => {
  const servicesList = Object.entries(services).map(([name, service]) => ({
    name,
    service
  }));

  try {
    await runServicesInSequence(servicesList);
  } catch (error) {
    console.error('Error running review services:', error);
  }
};

const startServer = async () => {
  const port = process.env.PORT || 8000;
  
  try {
    // Iniciar el servidor
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    // Configurar los cron jobs
    // Actualizaciones diarias a las 00:00
    cron.schedule('0 0 * * *', runDailyUpdates, {
      scheduled: true,
      timezone: "Europe/Madrid"
    });

    // Servicios de revisión cada 6 horas
    cron.schedule('0 */6 * * *', runReviewServices, {
      scheduled: true,
      timezone: "Europe/Madrid"
    });

    // Ejecutar actualizaciones iniciales
    console.log('Running initial updates...');
    await runDailyUpdates();
    
    // Ejecutar servicios de revisión iniciales
    console.log('Starting review services...');
    await runReviewServices();

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar el servidor
startServer().catch(error => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});

module.exports = app;