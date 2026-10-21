// --- Version 1 : Hello World ---
// async function handler(_req: Request): Promise<Response> {
//   return new Response("Hello World");
// }
//
// Deno.serve(handler);

// --- Version 2 : appel à l'API word2vec ---
// --- Version 3 : le mot du joueur est lu dans l'URL (?word=...) ---

// Le mot à deviner reste côté serveur : le joueur ne peut pas le lire dans le front
const SECRET_WORD = "centrale";

function handlePreFlightRequest(): Response {
  return new Response("Preflight OK!", {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type",
    },
  });
}

async function handler(_req: Request): Promise<Response> {
  if (_req.method == "OPTIONS") {
    // Sans return, la réponse du preflight était ignorée et on appelait word2vec pour rien
    // handlePreFlightRequest();
    return handlePreFlightRequest();
  }

  const guessedWord = new URL(_req.url).searchParams.get("word");
  if (!guessedWord) {
    return new Response("Missing 'word' query parameter", {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  // const similarityRequestBody = JSON.stringify({
  //   word1: "centrale",
  //   word2: "supelec",
  // });
  const similarityRequestBody = JSON.stringify({
    word1: SECRET_WORD,
    word2: guessedWord.trim().toLowerCase(),
  });

  // Typé en RequestInit, sinon TS refuse redirect: string
  const requestOptions: RequestInit = {
    method: "POST",
    headers: headers,
    body: similarityRequestBody,
    redirect: "follow",
  };

  try {
    // La racine de l'API renvoie maintenant 404 : la route est /similarity
    // const response = await fetch("https://word2vec-ten.vercel.app", requestOptions);
    const response = await fetch("https://word2vec-ten.vercel.app/similarity", requestOptions);

    if (!response.ok) {
      console.error(`Error: ${response.statusText}`);
      return new Response(`Error: ${response.statusText}`, {
        // On renvoie le vrai statut (ex : 404 pour un mot inconnu) pour que le front détecte l'erreur
        // status: 200,
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "content-type",
        },
      });
    }

    const result = await response.json();

    console.log(result);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
      },
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return new Response(`Error: ${(error as Error).message}`, { status: 500 });
  }
}

Deno.serve(handler);
