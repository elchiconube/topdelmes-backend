const axiosConfig = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
  },
};

module.exports = axiosConfig;
