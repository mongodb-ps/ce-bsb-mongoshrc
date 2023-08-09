
function getAllDatabases(pattern) {
  var databases = [];
  db.getMongo().getDBNames().forEach(function(database) {
    if (database != 'admin' && database != 'local' && database != 'config' && pattern !== null && database.match(pattern)) {
      databases.push(database);
    }
  })
  return databases;
}

function getAllNameSpaces(pattern) {
  var namespaces = [];
  getAllDatabases().forEach(function(database) {
    db.getSiblingDB(database).getCollectionNames().forEach(function(collection) {
      var ns = database + '.' + collection;
      if ( pattern == null || ns.match(pattern) ) {
        namespaces.push(database + '.' + collection)
      }
    })
  });
  return namespaces;
}

function getAllCollections(pattern) {
  var databases = [];
  getAllDatabases().forEach(function(database) {
    var dbObj = { "db": database, "col": [] }
    db.getSiblingDB(database).getCollectionNames().forEach(function(collection) {
      var ns = database + '.' + collection;
      if ( pattern == null || ns.match(pattern) ) {
        dbObj.col.push(collection)
      }
    });
    if (dbObj.col.length > 0) {
      databases.push(dbObj);
    }
  });
  return databases;
}

function getCollection(namespace) {
  var ns = namespace.split(".");
  var database = ns[0];
  var collection = ns[1];
  if (database !== null && collection !== null) {
    collection = db.getSiblingDB(database)[collection];
  }
  return collection;
}

function dropAllDatabases(pattern) {
  getAllDatabases(pattern).forEach(function(database) {
    db.getSiblingDB(database).dropDatabase();
  });
}

function setProfilingLevelAllDatabases(level, msThreshold, pattern) {
  if (level == null){
    level = 0;
  }
  if (msThreshold == null){
    msThreshold = 100;
  }
  getAllDatabases(pattern).forEach(function(database) {
    db.getSiblingDB(database).setProfilingLevel(level, msThreshold);
  });
}

function dropAllCollections(pattern) {
  getAllNameSpaces(pattern).forEach(function(ns) {
    getCollection(ns).drop()
  });
}

function dropAllCollections(pattern) {
  getAllNameSpaces(pattern).forEach(function(ns) {
    getCollection(ns).drop()
  });
}

function getProfilingStatusAllDatabases(pattern) {
  var profilingStatuses = [];
  getAllDatabases(pattern).forEach(function(database) {
    var dbObj = { "db": database }
    dbObj.profilingStatus = db.getSiblingDB(database).getProfilingStatus();
    profilingStatuses.push(dbObj);
  }); 
  return profilingStatuses;
}

function getAllIndexes(pattern) {
  var indexes = [];
  getAllNameSpaces(pattern).forEach(function(ns) {
    var dbObj = { "ns": ns }
    dbObj.indexes = getCollection(ns).getIndexes();  
    indexes.push(dbObj);
  }); 
  return indexes;
}

function dropAllIndexes(pattern) {
  getAllNameSpaces().forEach(function(namespace) {
    if ( pattern == null || namespace.match(pattern) ) {
      getCollection(namespace).dropIndexes();  
    }
  }); 
}

