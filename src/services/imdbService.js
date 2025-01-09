const cheerio = require("cheerio");
const { maxLength } = require("../utils/helper");
const axios = require("axios");
const slugify = require("../utils/slugify");

const getHtml = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive"
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching IMDB data: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
    }
    throw error;
  }
};

const getElementData = (element, selector, attribute, transformation) => {
  const elem = element.find(selector);
  if (elem?.length > 0) {
    let value = attribute ? elem.attr(attribute) : elem.text();
    if (transformation) {
      value = transformation(value);
    }
    return value;
  }
  return null;
};


const updatePosterUrl = (url) => {
  if (!url) return null;
  
  // Patrón para detectar y reemplazar el sufijo de tamaño
  const pattern = /._V1.*\.jpg/;
  // Sufijo para obtener la imagen de alta calidad
  const newSuffix = '._V1_FMjpg_UX674_.jpg';
  
  return url.replace(pattern, newSuffix);
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
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDay = currentDate.getDate();
  
  // Si estamos en el año actual, usamos release_date para obtener un rango específico
  if (year === currentYear) {
    let start_date = `${year}-01-01`;
    let end_date = `${year}-${String(currentMonth).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`;

    return `https://www.imdb.com/search/title/?title_type=${title_type}&release_date=${start_date},${end_date}&sort=release_date,desc`;
  }
  
  return `https://www.imdb.com/search/title/?title_type=${title_type}&year=${year}`;
};

const scrapeIMDB = async ({ title_type, year, month }) => {
  const url = buildIMDBUrl({ title_type, year, month });
  console.log(`Scraping IMDB with URL: ${url}`);

  try {
    const html = await getHtml(url);
    const $ = cheerio.load(html);
    const data = [];

    // Verificar si hay resultados usando el nuevo selector
    const listItems = $(".ipc-metadata-list-summary-item");
    if (listItems.length === 0) {
      console.log(`No results found for ${title_type} in ${year}${month ? '/' + month : ''}`);
      return [];
    }

    listItems.each((i, el) => {
      // Extraer la información usando los nuevos selectores
      const title = $(el).find('.ipc-title__text').text().replace(/^\d+\.\s/, '').trim();
      const imdb_url = 'https://www.imdb.com' + $(el).find('.ipc-title-link-wrapper').attr('href');
      const imdb_id = imdb_url.match(/tt\d+/)?.[0] || '';
      
      // Rating y votes están dentro de .ipc-rating-star--imdb
      const rating = parseFloat($(el).find('.ipc-rating-star--imdb .ipc-rating-star--rating').text()) || 0;
      const votes_text = $(el).find('.ipc-rating-star--voteCount').text().replace(/[^\d]/g, '');
      const votes = parseInt(votes_text) || 0;

      // Descripción ahora está en .ipc-html-content-inner-div
      const description = maxLength($(el).find('.ipc-html-content-inner-div').text().trim());

      // Poster ahora está en una estructura diferente
      const posterBase = $(el).find('.ipc-image').attr('src');
      const poster = updatePosterUrl(posterBase);
            
      // Metadata como duración y año están en spans con clase específica
      const metadata = $(el).find('.dli-title-metadata-item');
      const pub_year = metadata.first().text().trim();
      const duration = metadata.eq(1).text().trim();
      const certificate = metadata.eq(2).text().trim();

      const item = {
        imdb_id,
        title,
        slug: slugify(title),
        imdb: rating,
        description,
        poster,
        imdb_url,
        votes,
        duration,
        pub_year,
        certificate,
        type: title_type,
      };

      data.push(item);
    });

    console.log(`Found ${data.length} items for ${title_type} in ${year}${month ? '/' + month : ''}`);
    return data;
  } catch (error) {
    console.error(`Error scraping IMDB: ${error.message}`);
    return [];
  }
};


module.exports = { scrapeIMDB };
