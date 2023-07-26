const axios = require("axios");
const axiosConfig = require("../utils/axiosConfig");
const slugify = require("../utils/slugify");

const removeQueryParams = (url) => {
  let urlObj = new URL(url);
  urlObj.search = "";
  return urlObj.toString();
};

const logError = (error, context = "") => {
  console.error(`Error ${context}`);
  console.error(error.response?.data);
  console.error(error.response?.status);
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
    const response = await axios.get(
      `${process.env.STRAPI_URL}/contents?filters[slug][$eq]=${slug}`,
      axiosConfig
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
      },
      axiosConfig
    );

    if (response?.data?.data?.id) {
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
      axiosConfig
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

    delete item.position;

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
      axiosConfig
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

const checkIfReviewExistOnStrapi = async (reviewUrl) => {
  const url = removeQueryParams(reviewUrl);
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
    logError(error, "searching top from Strapi");
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
