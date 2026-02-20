require("dotenv").config();
const fetch = require("node-fetch");

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GOOGLE_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  console.log(JSON.stringify(data, null, 2));
}

listModels();