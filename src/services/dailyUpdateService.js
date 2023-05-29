const axios = require("axios");

const {
  searchTopFromStrapi,
  manageContentOnStrapi,
  updateTopToStrapi,
} = require("./strapiService");
const { scrapeIMDB } = require("./imdbService");
const createTop = async ({ year, month }) => {
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
    });
};

const dailyUpdate = async () => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const currentTop = await searchTopFromStrapi({
    month: month,
    year: year,
  });

  if (currentTop) {
    const imdbMovies = await scrapeIMDB({ title_type: "movie", year, month });
    const imdbSeries = await scrapeIMDB({
      title_type: "tv_series",
      year,
      month,
    });

    const imdbData = [...imdbMovies, ...imdbSeries];
    const contents = await manageContentOnStrapi(imdbData);

    const top = await updateTopToStrapi({
      id: currentTop.id,
      year,
      month,
      contents,
    });

    if (top) {
      console.log("Top actualizado exitosamente");
    }
  } else {
    createTop({ year, month });
  }
};

module.exports = { dailyUpdate };
