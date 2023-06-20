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
    let response = await axios.get("https://martincid.com/es/");
    let $ = cheerio.load(response.data);

    let newItem = null;

    $(
      "#wi-content > div > div > div > section.elementor-section.elementor-top-section.elementor-element.elementor-element-feed7e3.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div > div > div.elementor-element.elementor-element-605b70f.align-left.pagination-align-center.elementor-widget.elementor-widget-post-grid > div > div > div"
    ).each((i, el) => {
      newItem = $(el).find(".thumbnail-inner a").attr("href");
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

async function startMartinCidReviewService() {
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
      console.log("Review already exist:", reviewUrl);
    }
  } catch (error) {
    logError(error, "processing review");
  }
}

module.exports = { startMartinCidReviewService };
