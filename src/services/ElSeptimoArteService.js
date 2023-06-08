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
      "https://www.elseptimoarte.net/foro/index.php/board,4.0.html"
    );
    let $ = cheerio.load(response.data);

    let newItem = null;

    $(".table_grid > tbody > tr").each((i, el) => {
      if (i > 2) {
        newItem = $(el).find("td.subject a").attr("href");
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

    const title = $(
      "#quickModForm > div:nth-child(1) > div > div.postarea > div.post > div > div:nth-child(1) > span:nth-child(1) > strong"
    )
      .text()
      .replace(/\n/g, "");

    let content = $(
      "#quickModForm > div:nth-child(1) > div > div.postarea > div.post > div"
    )
      .text()
      .replace(/[+,]/g, "")
      .replace(/\n/g, "")
      .replace(/\t/g, "");

    const imageUrl = $(
      "#quickModForm > div:nth-child(1) > div > div.postarea > div.post > div > div:nth-child(17) > img"
    ).attr("src");
    const videoUrl = null;

    return { title, content, imageUrl, videoUrl };
  } catch (error) {
    logError(error, "getting review info");
  }
};

async function startElSeptimoArteReviewService() {
  try {
    const reviewUrl = await checkUrl();

    const isNew = await checkIfReviewExistOnStrapi(reviewUrl);

    if (isNew) {
      console.log("Review is new:", reviewUrl);

      const reviewInfo = await getReviewInfo(reviewUrl);

      const review = await getReviewFromAI(reviewInfo);

      const platform = await getPlatformFromStrapi(review?.platform);
      const content = await getContentFromStrapi(review?.content);

      if (review?.body) {
        await createReview({
          reviewInfo,
          review,
          platform,
          body: convertToMarkdown(review.body, review?.content),
          url: reviewUrl,
          content,
          contentName: review?.content,
          author: 6,
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

module.exports = { startElSeptimoArteReviewService };
