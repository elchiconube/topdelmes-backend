const cheerio = require("cheerio");
const { slugify, maxLength } = require("../utils/helper");
const axios = require("axios");

const getHtml = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1",
        "Accept-Language": "es-ES,es;q=0.8,en-US;q=0.6,en;q=0.4",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error al obtener el HTML de la url ${url}: ${error}`);
    throw error;
  }
};

const getElementData = (element, selector, attribute, transformation) => {
  const elem = element.find(selector);
  if (elem.length > 0) {
    let value = attribute ? elem.attr(attribute) : elem.text();
    if (transformation) {
      value = transformation(value);
    }
    return value;
  }
  return null;
};

const updatePosterUrl = (url) => {
  const pattern = /_V1_.*\.jpg/;
  const newSuffix = "_V1_SY1000_CR0,0,674,1000_AL_.jpg";
  const newUrl = url.replace(pattern, newSuffix);
  return newUrl;
};

const isValidDateForSeries = (year, month) => {
  const yearInt = parseInt(year);
  const monthInt = parseInt(month);

  if (yearInt < 1990 || (yearInt === 1990 && monthInt < 1)) {
    return false;
  }

  return true;
};

const buildIMDBUrl = ({ title_type, month, year }) => {
  let start_date = "";
  let end_date = "";

  if (month && year) {
    start_date = `${year}-${month}-01`;
    end_date = `${year}-${month}-${new Date(year, month, 0).getDate()}`;
  } else if (year) {
    start_date = `${year}-01-01`;
    end_date = `${year}-12-31`;
  }

  let imdbUrl = "https://www.imdb.com/search/title/?title_type=" + title_type;

  if (start_date && end_date) {
    imdbUrl += "&release_date=" + start_date + "," + end_date;
  } else if (year) {
    imdbUrl += "&year=" + year;
  }

  imdbUrl += "&start=1&ref_=adv_nxt";

  return imdbUrl;
};

const scrapeIMDB = async ({ title_type, year, month }) => {
  if (title_type === "tv_series" && !isValidDateForSeries(year, month)) {
    return [];
  }

  const url = buildIMDBUrl({ title_type, year, month });

  try {
    const html = await getHtml(url);
    const $ = cheerio.load(html);
    const data = [];

    $(".lister-item.mode-advanced").each((i, el) => {
      const imdb_url = getElementData(
        $(el),
        ".lister-item-header a",
        "href",
        (value) => `https://www.imdb.com${value}`
      );
      const title = getElementData(
        $(el),
        ".lister-item-header a",
        null,
        (value) => value.trim()
      );
      const item = {
        imdb_id: imdb_url ? imdb_url.match(/tt\d+/)[0] : "",
        title: title,
        slug: slugify(title),
        imdb: getElementData(
          $(el),
          ".ratings-imdb-rating",
          "data-value",
          (value) => parseFloat(value.trim())
        ),
        description: maxLength(
          getElementData(
            $(el),
            ".lister-item-content p:nth-of-type(2)",
            null,
            (value) => value.trim()
          )
        ),
        poster: getElementData(
          $(el),
          ".lister-item-image img",
          "loadlate",
          updatePosterUrl
        ),
        imdb_url: imdb_url,
        votes: getElementData(
          $(el),
          ".sort-num_votes-visible span:nth-of-type(2)",
          null,
          (value) => parseInt(value.trim().replace(",", ""))
        ),
        runtime: getElementData($(el), ".runtime", null, (value) =>
          parseInt(value.trim().replace(" min", ""))
        ),
        pub_year: getElementData($(el), ".lister-item-year", null, (value) =>
          value.trim().replace("(II) ", "")
        ),
        genre: getElementData($(el), ".genre", null, (value) => value.trim()),
        certificate: getElementData($(el), ".certificate", null, (value) =>
          value.trim()
        ),
        metascore: getElementData($(el), ".metascore", null, (value) =>
          parseInt(value.trim())
        ),
        director: getElementData(
          $(el),
          ".lister-item-content p:nth-of-type(3) a:nth-of-type(1)",
          null,
          (value) => value.trim()
        ),
        type: title_type,
      };

      data.push(item);
    });

    return data;
  } catch (error) {
    console.error("Error al hacer scrape a IMDB:", error);
    return [];
  }
};

module.exports = { scrapeIMDB };
