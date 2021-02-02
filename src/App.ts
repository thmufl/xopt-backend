import express from "express";
import fetch from "node-fetch"

const app = express();
const PORT = 8000;

process.env.ALPHA_VANTAGE_QUERY_URL = "https://www.alphavantage.co/query";
process.env.ALPHA_VANTAGE_API_KEY = "3EBLV8FMHCBNU0JI";

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", (req, res) => res.send("Express + TypeScript Server"));

app.get("/api/currency-exchange-rate/:from/:to", async (req, res) => {
  const func = "CURRENCY_EXCHANGE_RATE";
  const from = req.params.from;
  const to = req.params.to;
  const request = await fetch(
    `${process.env.ALPHA_VANTAGE_QUERY_URL}?function=${func}&from_currency=${from}&to_currency=${to}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
  );
  const data = await request.json();
  res.json({ data });
});

app.get("/api/crypto-rating/:symbol", async (req, res) => {
  const func = "CRYPTO_RATING"
  const symbol = req.params.symbol;
  const request = await fetch(
    `${process.env.ALPHA_VANTAGE_QUERY_URL}?function=${func}&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
  );
  const data = await request.json();
  res.json({ data });
});

app.get("/api/admin/refresh-digital-currency-daily/:symbol/:market", async (req, res) => {
  const func = "DIGITAL_CURRENCY_DAILY";
  const symbol = req.params.symbol;
  const market = req.params.market;
  const request = await fetch(
    `${process.env.ALPHA_VANTAGE_QUERY_URL}?function=${func}&symbol=${symbol}&market=${market}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
  );
  const data = await request.json();
  res.json({ data });
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
