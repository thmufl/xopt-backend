import express from "express";
import mongoose from "mongoose";
import fetch from "node-fetch";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const PORT = 8000;

process.env.MONGO_DB_URL = "mongodb://localhost:27017/xopt";
process.env.ALPHA_VANTAGE_URL = "https://www.alphavantage.co";
process.env.ALPHA_VANTAGE_API_KEY = "3EBLV8FMHCBNU0JI";

mongoose.connect(process.env.MONGO_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  // we're connected!
  console.log("Connected to MongoDb...");
});

const exchangeRateSchema = new mongoose.Schema({
  fromCurrency: { code: String, name: String },
  toCurrency: { code: String, name: String },
  exchangeRate: Number,
  price: { bid: Number, ask: Number },
  date: Date,
});
const ExchangeRate = mongoose.model("ExchangeRate", exchangeRateSchema);

const portfolioSchema = new mongoose.Schema({
  name: String,
  referenceCurrency: { code: String, name: String },
  positions: [
    { code: String, amount: Number, data: { type: Date, default: Date.now } },
  ],
  date: { type: Date, default: Date.now },
});
const Portfolio = mongoose.model("Portfolio", portfolioSchema);

const myPortfolio = new Portfolio({
  name: "My Portfolio",
  referenceCurrency: { symbol: "CHF", name: "Swiss Franc" },
  positions: [
    { symbol: "CHF", amount: 18.14, date: "2021-02-01" },
    { symbol: "BTC", amount: 0.04906209, date: "2021-02-01" },
    { symbol: "ETH", amount: 7.44958763, date: "2021-02-02" },
    { symbol: "EOS", amount: 177.6587, date: "2021-02-02" },
    { symbol: "XRP", amount: 7736.87334, date: "2021-02-05" },
    { symbol: "XLM", amount: 4061.5446194, date: "2021-02-06" },
    { symbol: "ZRX", amount: 4286.02097849, date: "2021-02-08" },
  ],
});

//myPortfolio.save();

app.get("/", (req, res) => res.send("Express + TypeScript Server"));

app.get(
  "/api/exchangeRate/:fromCurrency/:toCurrency/refresh",
  async (req, res) => {
    const fromCurrency = req.params.fromCurrency;
    const toCurrency = req.params.toCurrency;

    const func = "CURRENCY_EXCHANGE_RATE";
    const respone = await fetch(
      `${process.env.ALPHA_VANTAGE_URL}/query?function=${func}&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
    );

    const result = await respone.json()
    const data = result["Realtime Currency Exchange Rate"];

    const exchangeRate = new ExchangeRate({
      fromCurrency: {
        code: data["1. From_Currency Code"],
        name: data["2. From_Currency Name"],
      },
      toCurrency: {
        code: data["3. To_Currency Code"],
        name: data["4. To_Currency Name"],
      },
      exchangeRate: data["5. Exchange Rate"],
      price: { bid: data["8. Bid Price"], ask: data["9. Ask Price"] },
      date: new Date(data["6. Last Refreshed"]),
    });
    exchangeRate.save();
    res.json(exchangeRate);
  }
);

app.get("/api/exchangeRate/:fromCurrency/:toCurrency", async (req, res) => {
  const fromCurrency = req.params.fromCurrency;
  const toCurrency = req.params.toCurrency;
  const result = await ExchangeRate.find({
    "fromCurrency.code": fromCurrency,
    "toCurrency.code": toCurrency,
  })
  .sort('-date')
  .limit(1);
  res.json(result[0]);
});

app.get("/api/exchangeRate/:fromCurrency/:toCurrency/:fromDate", async (req, res) => {
  const fromCurrency = req.params.fromCurrency;
  const toCurrency = req.params.toCurrency;
  const fromDate = req.params.fromDate;

  const result = await ExchangeRate.find({
    "fromCurrency.code": fromCurrency,
    "toCurrency.code": toCurrency,
    "date": { $gte: fromDate }
  })
  .sort('-date')
  res.json(result);
});

app.get("/api/exchangeRate/:fromCurrency/:toCurrency/:fromDate/:toDate", async (req, res) => {
  const fromCurrency = req.params.fromCurrency;
  const toCurrency = req.params.toCurrency;
  const fromDate = req.params.fromDate;
  const toDate = req.params.toDate;

  const result = await ExchangeRate.find({
    "fromCurrency.code": fromCurrency,
    "toCurrency.code": toCurrency,
    "date": { $gte: fromDate, $lte: toDate }
  })
  .sort('-date')
  res.json(result);
});

app.get("/api/portfolio", async (req, res) => {
  const portfolios = await Portfolio.find();
  res.json(portfolios);
});

app.get("/api/portfolio/:id", async (req, res) => {
  const portfolio = await Portfolio.findOne({ _id: req.params.id });
  res.json(portfolio);
});

app.get("/api/crypto-rating/:symbol", async (req, res) => {
  const func = "CRYPTO_RATING";
  const symbol = req.params.symbol;
  const request = await fetch(
    `${process.env.ALPHA_VANTAGE_QUERY_URL}?function=${func}&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
  );
  const data = await request.json();
  res.json({ data });
});

app.get(
  "/api/admin/refresh-digital-currency-daily/:symbol/:market",
  async (req, res) => {
    const func = "DIGITAL_CURRENCY_DAILY";
    const symbol = req.params.symbol;
    const market = req.params.market;
    const request = await fetch(
      `${process.env.ALPHA_VANTAGE_QUERY_URL}?function=${func}&symbol=${symbol}&market=${market}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
    );
    const data = await request.json();
    res.json({ data });
  }
);

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
