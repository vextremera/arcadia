import type { APIRoute } from "astro";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async () => {
  // Placeholder: luego lo conectamos a Google Places / etc.
  return json({
    reviews: [
      {
        id: "r1",
        name: "Pepito Fuentes",
        rating: 5,
        source: "internal",
        text: "Fui a cenar y la experiencia estuvo maravillosa. Comida muy buena y a muy buen precio.",
        avatarUrl: null,
      },
      {
        id: "r2",
        name: "Laura M.",
        rating: 5,
        source: "internal",
        text: "Bocatas enormes, servicio rápido y buen ambiente. Repetiremos seguro.",
        avatarUrl: null,
      },
      {
        id: "r3",
        name: "David R.",
        rating: 5,
        source: "internal",
        text: "Menú del mediodía top. Cocina casera y trato cercano.",
        avatarUrl: null,
      },
    ],
  });
};
