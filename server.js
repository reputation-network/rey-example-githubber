const TokenRepository = require("./lib/TokenRepository");
const WritePermissionRepository = require("./lib/WritePermissionRepository");
const githubLanguageScore = require("./lib/githubLanguageScore");
const tokenRepo = TokenRepository(process.env.MONGO_URL || "mongodb://localhost:27017/rey-example-githubber");
const wpRepo = WritePermissionRepository(process.env.MONGO_URL || "mongodb://localhost:27017/rey-example-githubber");

async function saveSubjectData(req, res, next) {
  const { token, writePermission } = req.body;
  console.log(req.body);
  // FIXME: We SHOULD validate the write permission!
  const subject = writePermission.subject;
  try {
    await Promise.all([
      tokenRepo.set(subject, token),
      wpRepo.set(subject, writePermission),
    ]);
    res.sendStatus(200);
  } catch (e) {
    res.status(500).send(e.message);
  }
}

function parseSubjectHeader(headers) {
  return JSON.parse(Buffer.from(headers["x-permission-subject"], "base64").toString("utf8")).toLowerCase();
}

function encodeWritePermissionHeader(wp) {
  return Buffer.from(JSON.stringify(wp), "utf8").toString("base64");
}

async function getData(req, res) {
  const subject = parseSubjectHeader(req.headers);
  const [token, wp] = await Promise.all([
    tokenRepo.get(subject),
    wpRepo.get(subject),
  ]);
  if (!token || !wp) {
  	res.sendStatus(404);
  } else {
    res.headers["x-write-permission"] = encodeWritePermissionHeader(wp);
	  res.json(await githubLanguageScore(token));
  }
}

function createServer() {
  const express = require("express");
  const morgan = require("morgan");
  const app = express();
  app.use(morgan("combined"));
  app.post("/saveData", express.json(), saveSubjectData);
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
    app_schema: [{ language: 30, weight: 30}, 50],
    app_dependencies: []
  }));
  app.use(express.static("public"));
  return app;
}

createServer().listen(process.env.PORT || 8000, console.log.bind(console))
