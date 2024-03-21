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

const removeQueryParams = (url) => {
  let urlObj = new URL(url);
  urlObj.search = "";
  return urlObj.toString();
};

const checkUrl = async () => {
  try {
    let response = await axios.get(
      "https://variety.com/v/film/reviews/"
    );
    let $ = cheerio.load(response.data);

    let newItem = null;

    $(".o-tease-news-list").each((i, el) => {
      newItem = $(el)
        .find(".o-tease-list__item .c-title a")
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

    const title = $("h1.c-heading")
      .text()
      .replace(/\n/g, "")
      .replace(/\t/g, "");

    let content = "";

    $(".vy-cx-page-content p").each((i, el) => {
      content += $(el)
        .text()
        .replace(/[+,]/g, "")
        .replace(/\n/g, "")
        .replace(/\t/g, "");
    });

    const imageUrl = $(
      ".article-header__feature img"
    ).attr("src");

    

    const videoUrl = null;

    return { title, content, imageUrl: removeQueryParams(imageUrl), videoUrl };
  } catch (error) {
    logError(error, "getting review info");
  }
};

async function startVarietyService() {
  try {
    
    const reviewUrl = await checkUrl();

    // const reviewUrl = 'https://variety.com/2023/film/reviews/one-life-review-anthony-hopkins-1235719982/'

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
          author: 1,
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

module.exports = { startVarietyService };
