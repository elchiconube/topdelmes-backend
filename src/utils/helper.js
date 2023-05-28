const getRandomDelay = () => {
  const minDelay = 2 * 60 * 60 * 1000; // 2 horas en milisegundos
  const maxDelay = 5 * 60 * 60 * 1000; // 5 horas en milisegundos
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
};

const slugify = (text) =>
  text &&
  text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

const convertToMarkdown = (body, workName) => {
  let markdownContent = "";
  body.forEach((section) => {
    markdownContent += `## ${section.title}\n`;
    markdownContent +=
      section.content.split(workName).join(`**${workName}**`) + "\n\n";
  });
  return markdownContent;
};

const maxLength = (text, length = 255) => {
  if (text.length > length) {
    return text.slice(0, length);
  } else {
    return text;
  }
};

const createReviewSlug = ({ title, type, platform }) => {
  let slug = `critica-review-${slugify(title)}`;

  if (type) {
    slug += `-${type}`;
  }

  if (platform) {
    slug += `-${slugify(platform)}`;
  }

  return slug;
};

const config = {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
  },
};

const logError = (error, context = "") => {
  console.error(`Error ${context}`);
  console.error(error.response?.data);
  console.error(error.response?.status);
};

const createReview = async ({
  reviewInfo,
  review,
  platform,
  body,
  url,
  content,
  author,
  contentName,
}) => {
  try {
    if (review) {
      const contentId = content?.id;
      const contentType = content?.type;
      const platformId = platform?.id;

      const data = {
        title: review.title,
        body,
        slug: createReviewSlug({
          title: contentName,
          type: contentType,
          platform: platform.title,
        }),
        image: reviewInfo.imageUrl,
        trailer: reviewInfo.videoUrl,
        director: review.director,
        rate: parseInt(review.rate),
        author,
        url,
        ...(contentId && { contents: [contentId] }),
        ...(platformId && { platform: platformId }),
      };

      const response = await postReviewOnStrapi(data);

      console.log("Review created:", response.id);
    }
  } catch (error) {
    logError(error, "creating review");
  }
};

module.exports = {
  maxLength,
  convertToMarkdown,
  createReviewSlug,
  slugify,
  config,
  getRandomDelay,
  createReview,
  logError,
};
