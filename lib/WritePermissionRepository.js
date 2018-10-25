const { MongoClient } = require('mongodb')
const URL = require('url')

function MongoWritePermissionRepository(url) {
  const db = MongoClient.connect(url, { useNewUrlParser: true })
  	.then(client => client.db())
  	.then(db => db.collection('write_permission'))
  return {
    get: (subject) =>
      db.then(db => db.findOne({ subject })
        .then(wp => wp || null)),
    set: (subject, writePermission) =>
      db.then(db => db.findOneAndReplace({subject}, writePermission, {upsert: true})
     	.then(r => writePermission)),
  }
}

function MemoryWritePermissionRepository() {
  const map = new Map()
  return {
    get: (subject) => map.get(subject) || null,
    set: (subject, writePermission) => map.get(subject, writePermission),
  }
}

module.exports = (url = '') => {
  const _url = URL.parse(url);
  if (_url.protocol === 'mongodb:') {
    return MongoWritePermissionRepository(url)
  } else {
      return MemoryWritePermissionRepository()
  }
}
