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
    let response = await axios.get("https://martincid.com/es/cine/criticas/");
    let $ = cheerio.load(response.data);

    let newItem = null;

    $(".blog-list").each((i, el) => {
      newItem = $(el).find(".post-item-title a").attr("href");
      return false; // break the loop
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

    const title = $(".post-title.post-item-title").text().replace(/\n/g, "");

    let content = "";

    $(".entry-content p").each((i, el) => {
      content += $(el)
        .text()
        .replace(/[+,]/g, "")
        .replace(/\n/g, "")
        .replace(/\t/g, "");
    });

    const imageUrl = $(".image-element.thumbnail-inner img").attr(
      "data-lazy-src"
    );
    const videoUrl = $(".rll-youtube-player").attr("data-src");

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

    const isNew = await checkIfReviewExistOnStrapi(reviewUrl);

    if (isNew) {
      console.log("Review is new:", reviewUrl);

      const reviewInfo = await getReviewInfo(reviewUrl);
      const review = await getReviewFromAI(reviewInfo);

      const platform = await getPlatformFromStrapi(review?.platform);
      const content = await getContentFromStrapi(review?.content);

      if (review.body) {
        await createReview({
          reviewInfo,
          review,
          platform,
          body: convertToMarkdown(review.body, review?.content),
          url: reviewUrl,
          content,
          contentName: review?.content,
          author: 2,
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

function startMartinCidReviewService() {
  processReview(); // Start the first run
}

module.exports = { startMartinCidReviewService };
