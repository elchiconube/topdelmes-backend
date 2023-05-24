const { scrapeIMDB } = require("../services/imdbService");
const {
  manageContentOnStrapi,
  postTopToStrapi,
  searchTopFromStrapi,
} = require("../services/strapiService");

const validateDate = (title_type, year, month) => {
  if (!title_type) {
    throw new Error(
      "El title_type es obligatorio debe de ser movie o tv_series"
    );
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // JavaScript's getMonth() method returns a value from 0-11, so we need to add 1 to make it from 1-12

  if (year > currentYear || (year == currentYear && month > currentMonth)) {
    throw new Error("La fecha no puede ser superior a la actual");
  }

  if (month < 1 || month > 12) {
    throw new Error(
      "El formato del mes es incorrecto. Debe estar entre 01 y 12"
    );
  }

  if (title_type == "tv_series" && year < 1990) {
    throw new Error(
      "Para las series de televisión, la fecha tiene que ser a partir de 1990"
    );
  }

  if (title_type == "movie" && year < 1920) {
    throw new Error(
      "Para las películas, la fecha tiene que ser a partir de 1920"
    );
  }
};

exports.handleTopRequest = async (req, res) => {
  try {
    const { title_type, year, month } = req.params;

    validateDate(title_type, year, month);

    const topFromServer = await searchTopFromStrapi({ month, year });

    if (topFromServer) {
      const result = topFromServer.attributes.contents.data.filter(
        (content) => content.attributes.type === title_type
      );
      res.send(result);
    } else {
      const imdbMovies = await scrapeIMDB({ title_type: "movie", year, month });
      const imdbSeries = await scrapeIMDB({
        title_type: "tv_series",
        year,
        month,
      });

      const imdbData = [...imdbMovies, ...imdbSeries];
      const contents = await manageContentOnStrapi(imdbData);

      const top = await postTopToStrapi({
        year,
        month,
        contents,
      });

      if (top) {
        const result = top.attributes.contents.data.filter(
          (content) => content.attributes.type === title_type
        );

        res.send(result);
      } else {
        throw new Error("Unable to create new TOP content");
      }
    }
  } catch (error) {
    if (error.response) {
      console.error(error.response.data);
      console.error(error.response.status);
      if (error.response.status === 404) {
        res.status(404).send({ message: "Not Found" });
      } else {
        res.status(500).send({ message: "Internal Server Error" });
      }
    } else {
      // Este error debe haber venido de validateDate
      res.status(400).send({ message: error.message });
    }
  }
};
