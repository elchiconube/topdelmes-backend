const { createReviewSlug, convertToMarkdown } = require("../utils/helper");
const axios = require("axios");
const cheerio = require("cheerio");
const {
  getContentFromStrapi,
  getPlatformFromStrapi,
  checkIfReviewExistOnStrapi,
} = require("./strapiService");
const { getReviewFromAI } = require("./iaService");

const checkUrl = async () => {
  let response = await axios.get("https://www.rogerebert.com/streaming");
  let $ = cheerio.load(response.data);

  const platforms = ["Netflix", "HBO", "Apple", "Prime Video", "Disney", "Sky"];
  let newItem = null;

  $(".page-content--block").each((i, el) => {
    const blockText = $(el).text();
    if (platforms.some((platform) => blockText.includes(platform))) {
      newItem = $(el).find(".blog-split--title").attr("href");
      return false; // break the loop
    }
  });

  return newItem;
};

const getReviewInfo = async (url) => {
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
};
const createReview = async ({
  reviewInfo,
  review,
  platform,
  body,
  url,
  content,
}) => {
  try {
    if (review) {
      const contentId = content?.id;
      const contentType = content?.type;
      const platformId = platform?.id;

      const response = await axios.post(`${process.env.STRAPI_URL}/reviews`, {
        data: {
          title: review.title,
          body,
          slug: createReviewSlug({
            title: review.title,
            type: contentType,
            platform: platform.title,
          }),
          image: reviewInfo.imageUrl,
          trailer: reviewInfo.videoUrl,
          director: review.director,
          rate: parseInt(review.rate),
          url,
          ...(contentId && { contents: [contentId] }),
          ...(platformId && { platform: platformId }),
        },
      });

      console.log("Review created:", response.data.data.id);
    }
  } catch (error) {
    console.error(`Error creating review: ${error}`);
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
          author: [1],
        });
      } else {
        console.log("No content found", review);
      }
    } else {
      console.log("Review already exist:", fullUrl);
    }
  } catch (error) {
    console.error(`Error processing review : ${error}`);
  } finally {
    setTimeout(processReview, 86400000); // 24 horas
  }
}

function startRogerEbertReviewService() {
  processReview(); // Start the first run
}

module.exports = { startRogerEbertReviewService };
