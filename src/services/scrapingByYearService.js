const axios = require("axios");

function startScrapingByYearService() {
  let year = 2023;

  // Verifica si la variable de entorno API_URL está definida
  if (!process.env.API_URL) {
    console.error("API_URL no está definida en las variables de entorno");
    return;
  }

  function scrapeYear() {
    const url = `${process.env.API_URL}/movie/${year}`;

    console.log(`Iniciando petición para el año ${year}...`);

    axios
      .get(url)
      .then(() => {
        console.log(
          `La petición para el año ${year} ha finalizado exitosamente.`
        );

        year--;

        // Verifica si hemos alcanzado el final de la secuencia
        if (year >= 1920) {
          // Programa la siguiente petición con un intervalo aleatorio
          const interval = getRandomInterval(2, 5);
          console.log(`La próxima iteración será en ${interval} minutos...`);
          setTimeout(scrapeYear, interval * 60 * 1000);
        } else {
          console.log("Secuencia completada.");
        }
      })
      .catch((error) => {
        console.error("Error en la petición:", error);
        console.log("Se ha quedado en el año:", year);
      });
  }

  // Inicia la primera petición
  scrapeYear();
}

function getRandomInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = { startScrapingByYearService };
