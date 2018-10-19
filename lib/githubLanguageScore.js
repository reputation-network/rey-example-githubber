const Octokit = require('@octokit/rest');
const _ = require("lodash");

module.exports = async function githubLanguageScore(token) {
  const octokit = Octokit();
  await octokit.authenticate({
    type: 'token',
    token: token,
  });
  const repos = await octokit.repos.getAll();
  const repoTags = repos.data.map((repo) => ({ owner: repo.owner.login, repo: repo.name }));
  const langInfo = await Promise.all(repoTags.map(async (r) =>
    octokit.repos.getLanguages(r)
      .catch(() => ({ data: {} }))
      .then(({data}) => data)
  ));
  let total = 0;
  // FIXME: We should weight the amount of commits by the user
  const aggregatedLangInfo = langInfo.reduce((aggregated, langInfo) => {
    Object.keys(langInfo).forEach((lang) => {
      const langWeight = langInfo[lang];
      aggregated[lang] = (aggregated[lang] || 0) + langWeight;
      total += langWeight;
    })
    return aggregated;
  }, {});

  const weightedLangInfo = _.mapValues(aggregatedLangInfo, (v) => v / total);

  let list = [];
  for (let language in weightedLangInfo) {
    list.push({ language: language, weight: weightedLangInfo[language] });
  }
  return list;
}
