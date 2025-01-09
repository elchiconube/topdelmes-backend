const axios = require("axios");

const {
  searchTopFromStrapi,
  manageContentOnStrapi,
  updateTopToStrapi,
  postTopToStrapi,
} = require("./strapiService");
const { scrapeIMDB } = require("./imdbService");

const yearlyUpdate = async () => {
  const year = new Date().getFullYear();

  try {
    console.log(`Starting yearly update for ${year}...`);
    
    const currentTop = await searchTopFromStrapi({ year });

    if (currentTop) {
      console.log(`Updating existing top for ${year}...`);
      
      const imdbMovies = await scrapeIMDB({ title_type: "feature", year });
      const imdbSeries = await scrapeIMDB({ title_type: "tv_series", year });

      const imdbData = [...imdbMovies, ...imdbSeries].sort(
        (a, b) => b.imdb - a.imdb // Ordenar por rating de IMDB descendente
      );
      
      const contents = await manageContentOnStrapi(imdbData);

      const top = await updateTopToStrapi({
        id: currentTop.id,
        year,
        contents,
      });

      if (top) {
        console.log(`Top ${year} updated successfully!`);
      } else {
        throw new Error(`Failed to update top for ${year}`);
      }
    } else {
      console.log(`Creating new top for ${year}...`);
      
      const imdbMovies = await scrapeIMDB({ title_type: "feature", year });
      const imdbSeries = await scrapeIMDB({ title_type: "tv_series", year });

      const imdbData = [...imdbMovies, ...imdbSeries].sort(
        (a, b) => b.imdb - a.imdb
      );
      
      const contents = await manageContentOnStrapi(imdbData);

      const top = await postTopToStrapi({
        year,
        contents,
      });

      if (top) {
        console.log(`New top for ${year} created successfully!`);
      } else {
        throw new Error(`Failed to create top for ${year}`);
      }
    }
  } catch (error) {
    console.error(`Error in yearly update for ${year}:`, error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }
    throw error;
  }
};

module.exports = { yearlyUpdate };