const { MongoClient } = require('mongodb')
const URL = require('url')

function MongoTokenRepository(url) {
  const db = MongoClient.connect(url, { useNewUrlParser: true })
  	.then(client => client.db())
  	.then(db => db.collection('token'))
  return {
    get: (subject) =>
      db.then(db => db.findOne({ subject })
        .then(st => st && st.token || null)),
    set: (subject, token) =>
      db.then(db => db.findOneAndReplace({subject}, {subject, token}, {upsert: true})
     	 .then(r => ({subject, token}))),
  }
}

function MemoryTokenRepository() {
  const map = new Map()
  return {
    get: (subject) => map.get(subject) || null,
    set: (subject, token) => map.get(subject, token),
  }
}

module.exports = (url = '') => {
  const _url = URL.parse(url);
  if (_url.protocol === 'mongodb:') {
    return MongoTokenRepository(url)
  } else {
    return MemoryTokenRepository()
  }
}
