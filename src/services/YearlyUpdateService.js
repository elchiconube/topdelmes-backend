const axios = require("axios");

const {
  searchTopFromStrapi,
  manageContentOnStrapi,
  updateTopToStrapi,
} = require("./strapiService");
const { scrapeIMDB } = require("./imdbService");
const createTop = async ({ year }) => {
  const url = `${process.env.API_URL}/movie/${year}`;

  console.log(`Creating top for year: ${year}...`);

  axios
    .get(url)
    .then(() => {
      console.log(`Request for top ${year}  was sent successfully`);
    })
    .catch((error) => {
      console.error(`Error creating top: ${year}`, error);
    });
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
