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
    let response = await axios.get("https://www.fotogramas.es/peliculas-criticas/");
    let $ = cheerio.load(response.data);


    let newItem = null;

    $("#main-content > section").each((i, el) => {
      const blockText = $(el).text();
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

    const title = $("#main-content > header h1").text().replace(/\n/g, "");
    const content = $(".article-body-content > p")
      .text()
      .replace(/[+,]/g, "")
      .replace(/\n/g, "");
    const imageUrl = $('div[data-embed="body-image"] > div > img').attr("src");

    return { title, content, imageUrl};
  } catch (error) {
    logError(error, "getting review info");
  }
};

async function startFotogramasReviewService() {
  try {
    const reviewUrl = await checkUrl();

    const fullUrl = `https://www.fotogramas.es${reviewUrl}`;

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
  }
}

module.exports = { startFotogramasReviewService };
