const { Configuration, OpenAIApi } = require("openai");
const JSON5 = require("json5");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const INITIAL_MESSAGES = [
  {
    role: "system",
    content: `Soy un crítico de cine experto de topdelmes.com, un sitio web que clasifica las películas y series más vistas de cada mes. Me gustaría que me ayudes a reescribir la crítica de una obra de cine o televisión en un tono correcto y humano, en español. La crítica debe tener una estructura bien definida con encabezados de segundo nivel, incluyendo una sección final titulada 'Conclusiones' que resuma mi evaluación. Por favor, menciona el nombre de la obra, los nombres de los actores, actrices, director y también la plataforma donde se puede ver la obra. Tu respuesta debe ser en formato JSON RFC8259, sin saltos de línea, ni comillas dobles, y debe seguir la estructura que te proporciono a continuación:
    {
      "title": "Título de la crítica",
      "description": "Resumen de la crítica en una frase",
      "body": [{title: "Título del párrafo", content: "Contenido del párrafo"}],
      "platform": "plataforma donde se visualiza la obra",
      "director": "Director de la obra",
      "rate": "Valoración del 1 al 10 de la obra en formato número",
      "content": "Nombre de la obra original"
    }
    El texto de la crítica debe tener una longitud adecuada para un buen posicionamiento SEO y debe estar escrita en Español,.`,
  },
];

const logError = (error, context = "") => {
  console.error(`Error ${context}`);
  console.error(error.response?.data);
  console.error(error.response?.status);
};

const getReviewFromAI = async ({
  title: reviewTitle,
  content: reviewContent,
}) => {
  try {
    console.log(`Getting review from AI for title: ${reviewTitle}`);
    const openai = new OpenAIApi(configuration);

    const completion = await Promise.race([
      openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          ...INITIAL_MESSAGES,
          {
            role: "user",
            content: `${reviewTitle} ${reviewContent}`,
          },
        ],
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 120000)
      ), // 2 minutes timeout
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
      throw new Error("No se ha podido transformar el JSON", response.data);
    }
  } catch (error) {
    logError(error, "calling OpenAI API");
    throw error;
  }
};

module.exports = {
  getReviewFromAI,
};
