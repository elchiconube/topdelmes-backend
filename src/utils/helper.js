const { postReviewOnStrapi } = require("../services/strapiService");
const slugify = require("./slugify");

const msToTime = (ms) => {
  let seconds = ms / 1000;
  let hours = parseInt(seconds / 3600);
  seconds = seconds % 3600;
  let minutes = parseInt(seconds / 60);
  return `${hours} hours y ${minutes} minutes`;
};

const getRandomDelay = (long = false) => {
  const minDelay = long ? 18 * 60 * 60 * 1000 : 1 * 60 * 60 * 1000;
  const maxDelay = long ? 24 * 60 * 60 * 1000 : 3 * 60 * 60 * 1000;
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
};

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
        description: review.description,
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
  getRandomDelay,
  createReview,
  logError,
  msToTime,
};
