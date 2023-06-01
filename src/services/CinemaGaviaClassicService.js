const axios = require("axios");
const cheerio = require("cheerio");
const {
  logError,
  createReview,
  convertToMarkdown,
} = require("../utils/helper");
const {
  checkIfReviewExistOnStrapi,
  getPlatformFromStrapi,
  getContentFromStrapi,
} = require("./strapiService");
const { getReviewFromAI } = require("./iaService");

const getReviewInfo = async (url) => {
  try {
    let response = await axios.get(url);
    let $ = cheerio.load(response.data);

    const title = $(".entry-title").text().replace(/\n/g, "");
    const content = $(".td-post-content")
      .text()
      .replace(/[+,]/g, "")
      .replace(/\n/g, "");
    const imageUrl = $(".td-post-featured-image img").attr("src");
    const videoUrl = null;

    return { title, content, imageUrl, videoUrl };
  } catch (error) {
    logError(error, "getting review info");
  }
};

const startCinemaGaviaClassicService = async (reviewUrl) => {
  try {
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
          author: 5,
        });
      } else {
        console.log("No content found", review);
      }
    } else {
      console.log("Review already exist:", reviewUrl);
    }
  } catch (error) {
    logError(error, "processing review");
  }
};

const startProcessingUrls = async (urls) => {
  for (const url of urls) {
    await startCinemaGaviaClassicService(url);
    // Espera entre 10 y 15 minutos.
    const sleepTime = Math.floor(Math.random() * (15 - 10 + 1)) + 10;
    console.log(
      `Waiting for ${sleepTime} minutes before processing the next URL.`
    );
    await new Promise((resolve) => setTimeout(resolve, sleepTime * 60 * 1000));
  }
};

module.exports = { startProcessingUrls };
