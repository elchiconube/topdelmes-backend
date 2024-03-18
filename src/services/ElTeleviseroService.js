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
      "https://eltelevisero.huffingtonpost.es/criticas/"
    );
    let $ = cheerio.load(response.data);

    let newItem = null;

    $(".site-main .listado-posts").each((i, el) => {
      newItem = $(el)
        .find(".entry-title a")
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

    const title = $(".entry-title")
      .text()
      .replace(/\n/g, "");

    let content = "";

    $(".content__main__content p").each((i, el) => {
      content += $(el)
        .text()
        .replace(/[+,]/g, "")
        .replace(/\n/g, "")
        .replace(/\t/g, "");
    });

    const imageUrl = $(
      ".post-thumbnail > figure > picture > source:nth-of-type(2)"
    ).attr("data-lazy-srcset");

    const videoUrl = $(
      "iframe[loading='lazy']"
    ).attr("data-lazy-src");;

    return { title, content, imageUrl, videoUrl };
  } catch (error) {
    logError(error, "getting review info");
  }
};

async function startElTeleviseroService() {
  try {
    
    const reviewUrl = await checkUrl();

    // const reviewUrl = 'https://eltelevisero.huffingtonpost.es/2024/03/si-te-gusto-los-bridgerton-puedes-ver-mary-george-el-culebron-palaciego-de-julianne-moore/'

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

module.exports = { startElTeleviseroService };
