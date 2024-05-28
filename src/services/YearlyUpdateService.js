const axios = require("axios");

const {
  searchTopFromStrapi,
  manageContentOnStrapi,
  updateTopToStrapi,
} = require("./strapiService");
const { scrapeIMDB } = require("./imdbService");


const createTop = async ({ year, month }) => {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    console.error("API_URL no está definida en el archivo .env");
    return;
  }

  const url = `${apiUrl}/movie/${year}/${String(month).padStart(2, "0")}`;

  console.log(`Creating top for year: ${year}/${month}...`);

  try {
    await axios.get(url);
    console.log(`Request for top ${year}/${month} was sent successfully`);
  } catch (error) {
    console.error(`Error creating top: ${year}/${month}`);
    console.error(error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
  }
};



const yearlyUpdate = async () => {
  const year = new Date().getFullYear();

  const currentTop = await searchTopFromStrapi({
    year: year,
  });

  if (currentTop) {
    const imdbMovies = await scrapeIMDB({ title_type: "movie", year });
    const imdbSeries = await scrapeIMDB({
      title_type: "tv_series",
      year,
    });

    const imdbData = [...imdbMovies, ...imdbSeries].sort(
      (a, b) => a.position - b.position
    );
    const contents = await manageContentOnStrapi(imdbData);

    const top = await updateTopToStrapi({
      id: currentTop.id,
      year,
      contents,
    });

    if (top) {
      console.log(`Top ${year} updated!`);
    }
  } else {
    createTop({ year });
  }
};

module.exports = { yearlyUpdate };
