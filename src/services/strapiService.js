const axios = require("axios");
const axiosConfig = require("../utils/axiosConfig");
const slugify = require("../utils/slugify");

const removeQueryParams = (url) => {
  let urlObj = new URL(url);
  urlObj.search = "";
  return urlObj.toString();
};

const validateContent = (item) => {
  // Convertir feature a movie, mantener tv_series como está
  const type = item.type === 'feature' ? 'movie' : item.type;
  
  // Convertir año a string
  const pub_year = item.pub_year?.toString() || new Date().getFullYear().toString();

  // Objeto base para Strapi
  const validatedItem = {
    title: item.title?.toString() || '',
    slug: slugify(item.title || ''),
    description: item.description?.substring(0, 255) || '',
    poster: item.poster || '',
    imdb_url: item.imdb_url || '',
    duration: item.duration || '',
    pub_year,
    imdb: parseFloat(item.imdb) || 0,
    votes: parseInt(item.votes) || 0,
    certificate: item.certificate || '',
    type,
    imdb_id: item.imdb_id || '',
  };

  // Limpiar campos vacíos
  Object.keys(validatedItem).forEach(key => {
    if (validatedItem[key] === undefined || validatedItem[key] === null || validatedItem[key] === '') {
      delete validatedItem[key];
    }
  });

  return validatedItem;
};

const logError = (error, context = "") => {
  console.error(`Error ${context}`);
  console.error(`Message: ${error.message}`);
  if (error.response) {
    console.error(`Status: ${error.response.status}`);
    console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    if (error.response.data?.error?.details?.errors) {
      console.error('Validation errors:', JSON.stringify(error.response.data.error.details.errors, null, 2));
    }
  }
};

const updateTopDescriptionsToStrapi = async ({
  year,
  description_series,
  description_movies,
}) => {
  const currentTop = await searchTopFromStrapi({ year });

  if (currentTop) {
    try {
      const serverUrl = `${process.env.STRAPI_URL}/tops/${currentTop.id}`;

      const response = await axios.put(
        serverUrl,
        {
          data: {
            description_series,
            description_movies,
          },
        },
        axiosConfig
      );

      return response.data.data;
    } catch (error) {
      logError(error, "updating descriptions on top to Strapi");
      return null;
    }
  }
};

const updateTopToStrapi = async ({ id, year, month, contents }) => {
  try {
    const serverUrl = `${process.env.STRAPI_URL}/tops/${id}`;

    const response = await axios.put(
      serverUrl,
      {
        data: {
          year,
          month,
          contents,
        },
      },
      axiosConfig
    );

    return response.data.data;
  } catch (error) {
    logError(error, "posting top to Strapi");
    return null;
  }
};

const postTopToStrapi = async ({ year, month = null, contents }) => {
  try {
    const serverUrl = `${process.env.STRAPI_URL}/tops?populate=*`;

    const response = await axios.post(
      serverUrl,
      {
        data: {
          year,
          month,
          contents,
        },
      },
      axiosConfig
    );

    return response.data.data;
  } catch (error) {
    logError(error, "posting top to Strapi");
    return null;
  }
};

const searchContentFromStrapi = async ({ slug }) => {
  try {
    // console.log(`Searching content with slug: ${slug}`);
    
    const response = await axios.get(
      `${process.env.STRAPI_URL}/contents?filters[slug][$eq]=${slug}`,
      axiosConfig
    );

    if (response.data.data.length > 0) {
      // console.log(`Found content with ID: ${response.data.data[0].id}`);
      return response.data.data[0];
    }
  } catch (error) {
    logError(error, "searching content from Strapi");
  }
  return null;
};

const updateContentOnStrapi = async ({ id, item }) => {
  try {
    const validatedItem = validateContent(item);

    const response = await axios.put(
      `${process.env.STRAPI_URL}/contents/${id}`,
      {
        data: validatedItem
      },
      axiosConfig
    );

    if (response?.data?.data?.id) {
      // console.log(`Content updated successfully with ID: ${response.data.data.id}`);
      return response.data.data.id;
    }
  } catch (error) {
    logError(error, "updating content on Strapi");
    // console.log("Failed content:", JSON.stringify(item, null, 2));
  }
  return null;
};

const postContentToStrapi = async ({ item }) => {
  try {
    // Validar y limpiar datos antes de enviar
    const validatedItem = validateContent(item);

    // console.log("Sending content to Strapi:", JSON.stringify(validatedItem, null, 2));

    const response = await axios.post(
      `${process.env.STRAPI_URL}/contents`,
      {
        data: validatedItem
      },
      axiosConfig
    );

    if (response?.data?.data?.id) {
      // console.log(`Content created successfully with ID: ${response.data.data.id}`);
      return response.data.data.id;
    }
  } catch (error) {
    logError(error, "posting content to Strapi");
    // console.log("Failed content:", JSON.stringify(item, null, 2));
  }
  return null;
};

const manageContentOnStrapi = async (data) => {
  // console.log(`Processing ${data.length} items`);
  const ids = [];

  for (const item of data) {
    try {
      const slug = slugify(item.title);
      // console.log(`Processing content with slug: ${slug}`);

      delete item.position;

      const content = await searchContentFromStrapi({ slug });

      if (content) {
        // console.log(`Updating existing content: ${content.id}`);
        const updateId = await updateContentOnStrapi({ id: content.id, item });
        if (updateId) {
          ids.push(updateId);
        }
      } else {
        // console.log(`Creating new content: ${item.title}`);
        const contentId = await postContentToStrapi({ item });
        if (contentId) {
          ids.push(contentId);
        }
      }
    } catch (error) {
      logError(error, `processing item: ${item.title}`);
    }
  }

  // console.log(`Successfully processed ${ids.length} out of ${data.length} items`);
  return ids;
};

const getContentFromStrapi = async (title) => {
  try {
    const response = await axios.get(
      `${process.env.STRAPI_URL}/contents?filters[title][$containsi]=${title}`,
      axiosConfig
    );


    if (!response.data.data.length) {
      return null;
    }

    return {
      id: response.data?.data[0]?.id,
      type:
        response.data?.data[0]?.attributes?.type === "movie"
          ? "pelicula"
          : "serie",
    };
  } catch (error) {
    logError(error, "getting content from Strapi");
    return null;
  }
};

const createPlatformOnStrapi = async (title) => {
  try {
    const response = await axios.post(
      `${process.env.STRAPI_URL}/platforms`,
      {
        data: {
          title,
          slug: slugify(title),
        },
      },
      axiosConfig
    );

    return response.data?.data;
  } catch (error) {
    logError(error, "creating platform on Strapi");
    return null;
  }
};

const getPlatformFromStrapi = async (title) => {
  try {
    const response = await axios.get(
      `${process.env.STRAPI_URL}/platforms?filters[slug][$containsi]=${slugify(
        title
      )}`,
      axiosConfig
    );

    if (response.data.data.length) {
      return {
        id: response.data?.data[0]?.id,
        title: response.data?.data[0]?.attributes.title,
      };
    }

    return await createPlatformOnStrapi(title);
  } catch (error) {
    logError(error, "getting platform from Strapi");
    return null;
  }
};

const checkIfReviewExistOnStrapi = async (reviewUrl, needToRemoveParamas = true) => {
  const url = needToRemoveParamas ? removeQueryParams(reviewUrl) : reviewUrl;
  try {
    let response = await axios.get(
      `${process.env.STRAPI_URL}/reviews?filters[url][$eq]=${url}`,
      axiosConfig
    );

    return !response.data.data.length > 0;
  } catch (error) {
    logError(error, `checking if review exists on Strapi with URL ${url}`);
    return true;
  }
};

const searchTopFromStrapi = async ({ month, year }) => {

  try {
    let url = `${process.env.STRAPI_URL}/tops?filters[$and][0][year][$eq]=${year}`;

    if (month) {
      url += `&filters[$and][1][month][$eq]=${month}&populate=*`;
    } else {
      url += `&filters[$and][1][month][$null]=null&populate=*`;
    }

    const response = await axios.get(url, axiosConfig);

    return response.data?.data[0];
  } catch (error) {
    console.log(`No top found for ${month}/${year}`)
    return null;
  }
};

const getTopFromStrapi = async ({ topId }) => {
  try {
    const response = await axios.get(
      `${process.env.STRAPI_URL}/tops/${topId}?populate=*`,
      axiosConfig
    );

    return response.data?.data;
  } catch (error) {
    logError(error, "getting top from Strapi");
    return null;
  }
};

const postReviewOnStrapi = async (data) => {
  try {
    const response = await axios.post(
      `${process.env.STRAPI_URL}/reviews`,
      {
        data,
      },
      axiosConfig
    );

    return response.data?.data;
  } catch (error) {
    // console.log(error.message)
    logError(error, "creating review on Strapi");
    return null;
  }
};

module.exports = {
  postReviewOnStrapi,
  postTopToStrapi,
  manageContentOnStrapi,
  getContentFromStrapi,
  getPlatformFromStrapi,
  checkIfReviewExistOnStrapi,
  searchTopFromStrapi,
  getTopFromStrapi,
  updateTopToStrapi,
  updateTopDescriptionsToStrapi,
};
