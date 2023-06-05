const { Configuration, OpenAIApi } = require("openai");
const JSON5 = require("json5");
const { updateTopDescriptionsToStrapi } = require("./strapiService");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const getInitialMessages = (year) => [
  {
    role: "system",
    content: `Imagina que eres un experto periodista de cine y series. Escribe una crónica de los eventos notables en el año ${year}, con especial atención en el cine. Destaca las películas más importantes, directores, actores, actrices, contexto histórico y cualquier otro dato relevante en el mundo del cine. Considera los siguientes puntos:
    1 - El texto está destinado a ser posicionado con las palabras “mejores peliculas y series ${year}".
    2 - El contenido es para una página web especializada en cine y series llamada topdelmes.com.
    3 - Redacta el texto en markdown.
    Tu respuesta debe ser en formato JSON RFC8259, sin saltos de línea, ni comillas dobles, y debe seguir la estructura que te proporciono a continuación:
    {
        “description_series”:  Crónica de las series y personalidades más destacadas del año ${year}.
        “description_movies”:  Crónica de las películas y personalidades más destacadas del año ${year}.
    }`,
  },
];

async function getReviewFromAI(year) {
  console.log(`Getting year review from AI for year ${year}`);
  const openai = new OpenAIApi(configuration);

  try {
    const completion = await Promise.race([
      openai.createChatCompletion({
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
      console.log("Parsed response successfully.");
      return json;
    } catch (error) {
      console.error("Error parsing the response:");
      console.error("Full response:", data);
      throw new Error("Couldn't parse the JSON", response.data);
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
      const response = await getReviewFromAI(year);
      await updateTopDescriptionsToStrapi(response);
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
