
function pluginHelp(pattern) {
  print(".mongoshrc Plug In Help:\n");
  if('dropCollections'.match(pattern)) {
    print("  dropCollections(pattern)");
    print("    Parameters:");
    print("      pattern - regex/string to limit collections/namespaces dropped");
    print("    Returns:");
    print("      [ { db: <db>, profilingStatus: <profilingStatus> } ]\n");
  }
  if('dropDatabases'.match(pattern)) {
    print("  dropDatabases(pattern)");
    print("    Parameters:");
    print("      pattern - regex/string to limit databases dropped");
    print("    Returns:");
    print("      \n");
  }
  if('dropIndexes'.match(pattern)) {
    print("  dropIndexes(pattern)");
    print("    Parameters:");
    print("      pattern - regex/string to limit namespaces");
    print("    Returns:");
    print("      [ { ns: <db>.<col>, indexes: <indexes> } ]\n");
  }
  if('getCollections'.match(pattern)) {
    print("  getCollections(pattern)");
    print("    Parameters:");
    print("      pattern - regex/string to limit databases returned");
    print("    Returns:");
    print("      [ { db: <db>, col: [ <col>, ...], ... ]\n");
  }
  if('getDatabases'.match(pattern)) {
    print("  getDatabases(pattern)");
    print("    Parameters:");
    print("      pattern - regex/string to limit databases returned");
    print("    Returns:");
    print("      [ <db>, ... ]\n");
  }
  if('getIndexes'.match(pattern)) {
    print("  getIndexes(pattern)");
    print("    Parameters:");
    print("      pattern - regex/string to limit namespaces");
    print("    Returns:");
    print("      [ { ns: <db>.<col>, indexes: <indexes> } ]\n");
  }
  if('getNameSpaces'.match(pattern)) {
    print("  getNameSpaces(pattern)");
    print("    Parameters:");
    print("      pattern - regex/string to limit databases returned");
    print("    Returns:");
    print("      [ <ns>, ... ]\n");
  }
  if('getCollection'.match(namespace)) {
    print("  getCollection(ns)");
    print("    Parameters:");
    print("      namespace - <db>.<col>");
    print("    Returns:");
    print("      <collectionObject\n");
  }
  if('getProfilingStatus'.match(pattern)) {
    print("  getProfilingStatus(pattern)");
    print("    Parameters:");
    print("      pattern - regex/string to limit databases");
    print("    Returns:");
    print("      [ { db: <db>, profilingStatus: <profilingStatus> } ]\n");
  }
  if('setProfilingLevel'.match(pattern)) {
    print("  setProfilingLevel(pattern)");
    print("    Parameters:");
    print("      pattern - regex/string to limit databases returned");
    print("    Returns:");
    print("      [ { db: <db>, profilingStatus: <profilingStatus> } ]\n");
  }
}

function dropCollections(pattern) {
  var results = [];
  getNameSpaces(pattern).forEach(function(ns) {
    dbObj = { "ns": ns }
    dbObj.result = getCollection(ns).drop()
    results.push(dbObj);
  });
  return results;
}

function dropDatabases(pattern) {
  getDatabases(pattern).forEach(function(database) {
    db.getSiblingDB(database).dropDatabase();
  });
}

function dropIndexes(nsPattern, idxPattern) {
  var results = [];
  if(idxPattern == null) {
    getNameSpaces(nsPattern).forEach(function(ns) {
      var dbObj = { "ns": ns }
      dbObj.result = getCollection(ns).dropIndexes();  
      results.push(dbObj);
    });
  } else {
    getIndexes(nsPattern, idxPattern).forEach(function(ns) {
      var dbObj = { "ns": ns.ns, result: [] }
      ns.indexes.forEach(function(idx) {
        dbObj.result.push(getCollection(ns.ns).dropIndex(idx.name));
      }); 
      results.push(dbObj);
    });
  }
  return results;
}

function getCollections(pattern) {
  var databases = [];
  getDatabases().forEach(function(database) {
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

function getDatabases(pattern) {
  var databases = [];
  db.getMongo().getDBNames().forEach(function(database) {
    if (database != 'admin' && database != 'local' && database != 'config' && pattern !== null && database.match(pattern)) {
      databases.push(database);
    }
  })
  return databases;
}

function getIndexes(nsPattern, idxPattern) {
  var results = [];
  getNameSpaces(nsPattern).forEach(function(ns) {
    var dbObj = { "ns": ns, "indexes": [] }
    if(idxPattern == null) {
      dbObj.indexes = getCollection(ns).getIndexes();  
    } else {
      getCollection(ns).getIndexes().forEach(function(idx) {
        if (idx.name.match(idxPattern)) {
          dbObj.indexes.push(idx);
        }
      });  
    }
    if(dbObj.indexes.length > 0) {
      results.push(dbObj);
    }
  }); 
  return results;
}

function getNameSpaces(pattern) {
  var namespaces = [];
  getDatabases().forEach(function(database) {
    db.getSiblingDB(database).getCollectionNames().forEach(function(collection) {
      var ns = database + '.' + collection;
      if ( pattern == null || ns.match(pattern) ) {
        namespaces.push(database + '.' + collection)
      }
    })
  });
  return namespaces;
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

function getProfilingStatus(pattern) {
  var results = [];
  getDatabases(pattern).forEach(function(database) {
    var dbObj = { "db": database }
    dbObj.profilingStatus = db.getSiblingDB(database).getProfilingStatus();
    results.push(dbObj);
  }); 
  return results;
}

function setProfilingLevel(level, msThreshold, pattern) {
  var databases = []
  if (level == null){
    level = 0;
  }
  if (msThreshold == null){
    msThreshold = 100;
  }
  getDatabases(pattern).forEach(function(database) {
    var dbObj = { "db": database } 
    dbObj.profilingStatus = db.getSiblingDB(database).setProfilingLevel(level, msThreshold);
    databases.push(dbObj);
  });
  return databases;
}



