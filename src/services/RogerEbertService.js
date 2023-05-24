const { createReviewSlug, convertToMarkdown } = require("../utils/helper");
const axios = require("axios");
const cheerio = require("cheerio");
const {
  getContentFromStrapi,
  getPlatformFromStrapi,
  checkIfReviewExistOnStrapi,
  postReviewOnStrapi,
} = require("./strapiService");
const { getReviewFromAI } = require("./iaService");

// Log error helper
const logError = (error, context = "") => {
  console.error(`Error ${context}`);
  console.error(error.response?.data);
  console.error(error.response?.status);
};

const checkUrl = async () => {
  try {
    let response = await axios.get("https://www.rogerebert.com/streaming");
    let $ = cheerio.load(response.data);

    const platforms = [
      "Netflix",
      "HBO",
      "Apple",
      "Prime Video",
      "Disney",
      "Sky",
    ];
    let newItem = null;

    $(".page-content--block").each((i, el) => {
      const blockText = $(el).text();
      if (platforms.some((platform) => blockText.includes(platform))) {
        newItem = $(el).find(".blog-split--title").attr("href");
        return false; // break the loop
      }
    });

    return newItem;
  } catch (error) {
    logError(error, "checking URL");
  }
};

const getReviewInfo = async (url) => {
  try {
    let response = await axios.get(url);
    let $ = cheerio.load(response.data);

    const title = $(".page-content--title").text().replace(/\n/g, "");
    const content = $(".page-content--block_editor-content")
      .text()
      .replace(/[+,]/g, "")
      .replace(/\n/g, "");
    const imageUrl = $(".page-content--primary-image img").attr("src");
    const videoUrl = $('iframe[title="YouTube video player"]').attr("src");

    return { title, content, imageUrl, videoUrl };
  } catch (error) {
    logError(error, "getting review info");
  }
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

async function processReview() {
  try {
    const reviewUrl = await checkUrl();

    const fullUrl = `https://www.rogerebert.com${reviewUrl}`;

    const isNew = await checkIfReviewExistOnStrapi(fullUrl);

    if (isNew) {
      console.log("Review is new:", fullUrl);

      const reviewInfo = await getReviewInfo(fullUrl);
      const review = await getReviewFromAI(reviewInfo);

      const platform = await getPlatformFromStrapi(review?.platform);
      const content = await getContentFromStrapi(review?.content);

      if (review.body) {
        await createReview({
          reviewInfo,
          review,
          platform,
          body: convertToMarkdown(review.body, review?.content),
          url: fullUrl,
          content,
          contentName: review?.content,
          author: 1,
        });
      } else {
        console.log("No content found", review);
      }
    } else {
      console.log("Review already exist:", fullUrl);
    }
  } catch (error) {
    logError(error, "processing review");
  } finally {
    setTimeout(processReview, 86400000); // 24 horas
  }
}

function startRogerEbertReviewService() {
  processReview(); // Start the first run
}

module.exports = { startRogerEbertReviewService };
