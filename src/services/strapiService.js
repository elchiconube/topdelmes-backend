const axios = require("axios");
const { slugify, config } = require("../utils/helper");

const postTopToStrapi = async ({ year, month, contents }) => {
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
};

const searchContentFromStrapi = async ({ slug }) => {
  const response = await axios.get(
    `${process.env.STRAPI_URL}/contents?filters[slug][$eq]=${slug}`,
    config
  );

  if (response.data.data.length > 0) {
    return response.data.data[0];
  } else {
    return null;
  }
};

const updateContentOnStrapi = async ({ id, item }) => {
  const response = await axios.put(`${process.env.STRAPI_URL}/contents/${id}`, {
    data: item,
    config,
  });

  if (response.data.data.length > 0) {
    return response.data.data.id;
  } else {
    return null;
  }
};

const postContentToStrapi = async ({ item }) => {
  const response = await axios.post(
    `${process.env.STRAPI_URL}/contents`,
    {
      data: item,
    },
    config
  );

  return response.data.data.id;
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
      } else {
        console.error(`Error updating content ${item.id}`);
      }
    } else {
      const contentId = await postContentToStrapi({ item });
      if (contentId) {
        ids.push(contentId);
      } else {
        console.error(`Error creating content ${item.id}`);
      }
    }
  }

  return ids;
};

const getContentFromStrapi = async (title) => {
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
};

const createPlatformOnStrapi = async (title) => {
  const response = await axios.post(`${process.env.STRAPI_URL}/platforms`, {
    data: {
      title,
      slug: slugify(title),
    },
  });

  return response.data?.data;
};

const getPlatformFromStrapi = async (title) => {
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
  } else {
    const newPlatform = createPlatformOnStrapi(title);
    return {
      id: newPlatform.id,
      title: newPlatform.attributes.title,
    };
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
    console.error("Error searching review:", error);
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
    console.error("Error searching top:", error);
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
    console.error("Error getting top:", error);
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
