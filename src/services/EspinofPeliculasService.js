const {
  convertToMarkdown,
  logError,
  createReview,
} = require("../utils/helper");
const axios = require("axios");
const cheerio = require("cheerio");
const {
  getContentFromStrapi,
  getPlatformFromStrapi,
  checkIfReviewExistOnStrapi,
} = require("./strapiService");
const { getReviewFromAI } = require("./iaService");

const checkUrl = async () => {
  try {
    let response = await axios.get(
      "https://www.espinof.com/tag/criticas-de-peliculas"
    );
    let $ = cheerio.load(response.data);

    let newItem = null;

    $(".section-recent-list").each((i, el) => {
      newItem = $(el)
        .find(".abstract-article .base-asset-image a")
        .attr("href");
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

    const title = $(".article-featured-title-container h1 span")
      .text()
      .replace(/\n/g, "");

    let content = "";

    $(".blob p").each((i, el) => {
      content += $(el)
        .text()
        .replace(/[+,]/g, "")
        .replace(/\n/g, "")
        .replace(/\t/g, "");
    });

    const imageUrl = $(
      ".base-wrapper-image picture source:nth-of-type(2)"
    ).attr("srcset");

    const videoUrl = null;

    return { title, content, imageUrl, videoUrl };
  } catch (error) {
    logError(error, "getting review info");
  }
};

async function startEspinofPeliculaService() {
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
          author: 4,
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
}

module.exports = { startEspinofPeliculaService };
