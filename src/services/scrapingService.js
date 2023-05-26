const axios = require("axios");

function startScrapingService() {
  let year = 1991;
  let month = 4;

  const interval = setInterval(() => {
    const url = `${process.env.API_URL}/movie/${year}/${String(month).padStart(
      2,
      "0"
    )}`;

    console.log(`Iniciando petición para el año ${year} y mes ${month}...`);

    axios
      .get(url)
      .then(() => {
        console.log(
          `La petición para el año ${year} y mes ${month} ha finalizado exitosamente.`
        );
      })
      .catch((error) => {
        // Manejo de errores
        console.error("Error en la petición:", error);
        console.log("Se ha quedado en el año:", year);
        console.log("Mes:", month);
        clearInterval(interval);
      });

    // Actualizar año y mes para la siguiente iteración
    if (month === 1) {
      year--;
      month = 12;
    } else {
      month--;
    }

    // Verificar si se alcanzó el final de la secuencia
    if (year === 1920 && month === 1) {
      clearInterval(interval);
      console.log("Secuencia completada.");
    }
  }, getRandomInterval(2, 5) * 60 * 1000); // Intervalo aleatorio entre 2 y 5 minutos en milisegundos
}

function getRandomInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = { startScrapingService };
