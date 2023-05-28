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
      "https://tv.libertaddigital.com/seriemente.html"
    );
    let $ = cheerio.load(response.data);

    let newItem = null;

    $("article.result").each((i, el) => {
      newItem = $(el).find("a").attr("href");
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

    const title = $(".interior h1").text().replace(/\n/g, "");

    let content = "";

    $(".body p").each((i, el) => {
      content += $(el)
        .text()
        .replace(/[+,]/g, "")
        .replace(/\n/g, "")
        .replace(/\t/g, "");
    });

    const imageUrl = null;
    const videoUrl = null;

    return { title, content, imageUrl, videoUrl };
  } catch (error) {
    logError(error, "getting review info");
  }
};

async function startSeriementeReviewService() {
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
          author: 3,
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

module.exports = { startSeriementeReviewService };
