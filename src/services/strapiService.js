const axios = require("axios");
const { slugify, config } = require("../utils/helper");

const logError = (error, context = "") => {
  console.error(`Error ${context}`);
  console.error(error.response?.data);
  console.error(error.response?.status);
};

const postTopToStrapi = async ({ year, month, contents }) => {
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
      config
    );

    return response.data.data;
  } catch (error) {
    logError(error, "posting top to Strapi");
    return null;
  }
};

const searchContentFromStrapi = async ({ slug }) => {
  try {
    const response = await axios.get(
      `${process.env.STRAPI_URL}/contents?filters[slug][$eq]=${slug}`,
      config
    );

    if (response.data.data.length > 0) {
      return response.data.data[0];
    }
  } catch (error) {
    logError(error, "searching content from Strapi");
  }

  return null;
};

const updateContentOnStrapi = async ({ id, item }) => {
  try {
    const response = await axios.put(
      `${process.env.STRAPI_URL}/contents/${id}`,
      {
        data: item,
        config,
      }
    );

    if (response.data.data.length > 0) {
      return response.data.data.id;
    }
  } catch (error) {
    logError(error, "updating content on Strapi");
  }

  return null;
};

const postContentToStrapi = async ({ item }) => {
  try {
    const response = await axios.post(
      `${process.env.STRAPI_URL}/contents`,
      {
        data: item,
      },
      config
    );

    return response.data.data.id;
  } catch (error) {
    logError(error, "posting content to Strapi");
  }

  return null;
};

const manageContentOnStrapi = async (data) => {
  const ids = [];

  for (const item of data) {
    const slug = slugify(item.title);

    const content = await searchContentFromStrapi({ slug });

    if (content) {
      const updateId = await updateContentOnStrapi({ id: content.id, item });
      if (updateId) {
        ids.push(updateId);
      }
    } else {
      const contentId = await postContentToStrapi({ item });
      if (contentId) {
        ids.push(contentId);
      }
    }
  }

  return ids;
};

const getContentFromStrapi = async (title) => {
  try {
    const response = await axios.get(
      `${process.env.STRAPI_URL}/contents?filters[title][$containsi]=${title}`,
      config
    );

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
      config
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
      config
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

const checkIfReviewExistOnStrapi = async (reviewUrl) => {
  try {
    let response = await axios.get(
      `${process.env.STRAPI_URL}/reviews?filters[url][$eq]=${reviewUrl}`,
      config
    );

    return !response.data.data.length > 0;
  } catch (error) {
    logError(
      error,
      `checking if review exists on Strapi with URL ${reviewUrl}`
    );
    return true;
  }
};

const searchTopFromStrapi = async ({ month, year }) => {
  try {
    let url = `${process.env.STRAPI_URL}/tops?filters[$and][0][year][$eq]=${year}&populate=*`;

    if (month) {
      url += `&filters[$and][1][month][$eq]=${month}`;
    }

    const response = await axios.get(url, config);

    return response.data?.data[0];
  } catch (error) {
    logError(error, "searching top from Strapi");
    return null;
  }
};

const getTopFromStrapi = async ({ topId }) => {
  try {
    const response = await axios.get(
      `${process.env.STRAPI_URL}/tops/${topId}?populate=*`,
      config
    );

    return response.data?.data;
  } catch (error) {
    logError(error, "getting top from Strapi");
    return null;
  }
};

module.exports = {
  postTopToStrapi,
  manageContentOnStrapi,
  getContentFromStrapi,
  getPlatformFromStrapi,
  checkIfReviewExistOnStrapi,
  searchTopFromStrapi,
  getTopFromStrapi,
};
