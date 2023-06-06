const { Configuration, OpenAIApi } = require("openai");
const JSON5 = require("json5");
const { updateTopDescriptionsToStrapi } = require("./strapiService");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const getInitialMessages = (year) => [
  {
    role: "system",
    content: `Imagina que eres un periodista especializado en películas y series. En los textos intenta mencionar directores, actores, actrices y todo lo relativo al cine. El texto está destinado a ser posicionado con las palabras “mejores peliculas y series ${year}". El contenido es para una página web especializada en películas y series llamada topdelmes.com. Tu respuesta debe ser en formato JSON RFC8259, sin saltos de línea, ni comillas dobles, y debe seguir la estructura que te proporciono a continuación:
    {
     "description_series":  "Texto hablando de las series del año ${year}. Entre 300 y 600 palabras".
     "description_movies":  "Texto hablando de las películas del año ${year}. Entre 300 y 600 palabras".
    }
    `,
  },
];

async function getChronicFromAI(year) {
  console.log(`Getting year review from AI for year ${year}`);
  const openai = new OpenAIApi(configuration);

  try {
    const completion = await Promise.race([
      openai.createChatCompletion({
        max_tokens: 200,
        model: "gpt-3.5-turbo",
        messages: [
          ...getInitialMessages(year),
          {
            role: "user",
            content: `Análisis para el año ${year}`,
          },
        ],
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 120000)
      ),
    ]);

    console.log("Received response from AI.");
    const data = completion.data.choices[0].message?.content ?? "";
    let json;
    try {
      json = JSON5.parse(data);
      console.log("Parsed response successfully.", json);
      return json;
    } catch (error) {
      console.error("Error parsing the response:");
      console.error("Full response:", data);
      throw new Error("Couldn't parse the JSON", error);
    }
  } catch (error) {
    console.error("Error calling OpenAI API", error);
    throw error;
  }
}

async function runIAYearService() {
  let year = 2020;
  while (year >= 1920) {
    try {
      const response = await getChronicFromAI(year);
      const { description_movies, description_series } = response;
      await updateTopDescriptionsToStrapi({
        description_movies,
        description_series,
        year,
      });
      year--;
      console.log("Waiting for 5 minutes...");
      await new Promise((r) => setTimeout(r, 300000));
    } catch (error) {
      console.error("Error generating year review", error);
      break;
    }
  }
}

module.exports = {
  runIAYearService,
};
