const TokenRepository = require("./lib/TokenRepository");
const githubLanguageScore = require("./lib/githubLanguageScore");
const tokenRepo = TokenRepository(process.env.MONGO_URL || "mongodb://localhost:27017/rey-example-githubber");

function recoverSubject(token, signature) {
  const Accounts = require("web3-eth-accounts");
  const accounts = new Accounts();
  const subject = accounts.recover(token, signature).toLowerCase();
  return subject;
}

function saveToken(req, res, next) {
  const [schema, credentials] = req.headers.authorization.split(" ");
  const [token, signature] = credentials.split(":");
  const subject = recoverSubject(token, signature);
  return tokenRepo.set(subject, token)
  	.then(() => res.sendStatus(200))
  	.catch((e) => console.error(e))
}

function parseSubjectHeader(headers) {
  return JSON.parse(Buffer.from(headers["x-permission-subject"], "base64").toString("utf8")).toLowerCase();
}

async function getData(req, res) {
  const subject = parseSubjectHeader(req.headers);
  const token = await tokenRepo.get(subject);
  if (!token) {
  	res.sendStatus(404);
  } else {
	res.json(await githubLanguageScore(token));
  }
}

function createServer() {
  const express = require("express");
  const morgan = require("morgan");
  const app = express();
  app.use(morgan("combined"));
  app.post("/saveToken", saveToken);
  app.get("/data", getData);
  app.get("/manifest", (req, res) => res.json({
    version: '1.0',
    name: 'GitHubber',
    description: 'Returns an affinity score for each programming language you know',
    homepage_url: process.env.HOMEPAGE_URL || 'http://localhost:8000',
    picture_url: process.env.PICTURE_URL || 'https://avatars1.githubusercontent.com/u/42174428?s=200&v=4',
    address: process.env.APP_ADDRESS || '0x88032398beab20017e61064af3c7c8bd38f4c968',
    app_url: process.env.APP_URL || 'http://localhost:8000/data',
    app_reward: 0,
    app_dependencies: []
  }));
  app.use(express.static("public"));
  return app;
}

createServer().listen(process.env.PORT || 8000, console.log.bind(console))
