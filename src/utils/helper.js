const slugify = (text) =>
  text &&
  text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

const convertToMarkdown = (body, workName) => {
  let markdownContent = "";
  body.forEach((section) => {
    markdownContent += `## ${section.title}\n`;
    markdownContent +=
      section.content.split(workName).join(`**${workName}**`) + "\n\n";
  });
  return markdownContent;
};

const createReviewSlug = ({ title, type, platform }) => {
  let slug = `critica-review-${slugify(title)}`;

  if (type) {
    slug += `-${type}`;
  }

  if (platform) {
    slug += `-${slugify(platform)}`;
  }

  return slug;
};

const config = {
  headers: {
    "Content-Type": "application/json",
  },
};

module.exports = {
  convertToMarkdown,
  createReviewSlug,
  slugify,
  config,
};
