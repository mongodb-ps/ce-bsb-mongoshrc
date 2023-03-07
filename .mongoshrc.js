

function getAllDatabases() {
  var databases = [];
  db.getMongo().getDBNames().forEach(function(database) {
    if (database != 'admin' && database != 'local' && database != 'config') {
      databases.push(database);
    }
  })
  return databases;
}

function getAllNameSpaces() {
  var namespaces = [];
  getAllDatabases().forEach(function(database) {
    db.getSiblingDB(database).getCollectionNames().forEach(function(collection) {
      namespaces.push({ 'db': database, 'col': collection})
    })
  });
  return namespaces;
}

function getCollection(ns) {
  if ((ns.db !== null && ns.db !== '') && (ns.col !== null && ns.col !== '')) {
    coll = db.getSiblingDB(ns.db)[ns.col];
  }
  return coll;
}

function dropAllDatabases() {
  getAllDatabases().forEach(function(database) {
    db.getSiblingDB(database).dropDatabase();
  });
}

function getAllIndexes() {
  var indexes = {}
  getAllNameSpaces().forEach(function(ns) {
    if (!(ns.db in indexes)){
      indexes[ns.db] = {}
    }
    indexes[ns.db][ns.col] = getCollection(ns).getIndexes();  
  }); 
  return indexes;
}

function dropAllIndexes() {
  getAllNameSpaces().forEach(function(namespace) {
    getCollection(namespace).dropIndexes();  
  }); 
}

