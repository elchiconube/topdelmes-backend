const axios = require("axios");
require('dotenv').config();
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

  console.log(`Creating top for year: ${year}/${month}...`);

  axios
    .get(url)
    .then(() => {
      console.log(`Request for top ${year}/${month}  was sent successfully`);
    })
    .catch((error) => {
      console.error(`Error creating top: ${year}/${month}`);
      // console.error(error);
    });
};

const dailyUpdate = async () => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const currentTop = await searchTopFromStrapi({ month, year });

  if (currentTop) {
    const imdbMovies = await scrapeIMDB({ title_type: "movie", year, month });
    const imdbSeries = await scrapeIMDB({ title_type: "tv_series", year, month });

    const imdbData = [...imdbMovies, ...imdbSeries];
    const contents = await manageContentOnStrapi(imdbData);

    const top = await updateTopToStrapi({
      id: currentTop.id,
      year,
      month,
      contents,
    });

    if (top) {
      console.log(`Top ${month}/${year} updated!`);
    }
  } else {
    await createTop({ year, month });
  }
};

module.exports = { dailyUpdate };
