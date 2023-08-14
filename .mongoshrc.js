
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
    print("      [ ok: [10], msg: '...', err: '...', results: [<db>, ...] ]\n");
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
  if('getCollection'.match(pattern)) {
    print("  getCollection(namespace)");
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

function dropCollections(nsPattern) {
  var ret = { ok: 1, result: [] }
  try {
    getNameSpaces(nsPattern).result.forEach(function(ns) {
      print("ns: " + ns);
      dbObj = { "ns": ns }
      dbObj.result = getCollection(ns).drop()
      ret.result.push(dbObj);
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function dropDatabases(pattern) {
  var ret = { ok: 1, result: [] };
  try {
    getDatabases(pattern).result.forEach(function(database) {
      ret.result.push(getDatabase(database).dropDatabase());
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function dropIndexes(nsPattern, idxPattern) {
  ret = { ok: 1 }
  ret.results = [];
  try {
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
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function getCollection(namespace) {
  var ns = splitNameSpace(namespace)
  if (ns.db !== null && ns.col !== null) {
    collection = getDatabase(ns.db)[ns.col];
  }
  return collection;
}

function getCollections(pattern) {
  var ret = { ok: 1 }
  ret.result = [];
  try {
    getDatabases().result.forEach(function(database) {
      var dbObj = { "db": database, "col": [] }
      getDatabase(database).getCollectionNames().forEach(function(collection) {
        var ns = database + '.' + collection;
        if ( pattern == null || ns.match(pattern) ) {
          dbObj.col.push(collection)
        }
      });
      if (dbObj.col.length > 0) {
        ret.result.push(dbObj);
      }
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function getDatabase(database) {
  return db.getSiblingDB(database);
}

function getDatabases(dbPattern) {
  var ret = { ok: 1 }
  ret.result = [];
  try {
    db.getMongo().getDBNames().forEach(function(database) {
      if (database != 'admin' && database != 'local' && database != 'config' && dbPattern !== null && database.match(dbPattern)) {
        ret.result.push(database);
      }
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function getIndexes(nsPattern, idxPattern) {
  var ret = { ok: 1 }
  ret.result = [];
  try {
    getNameSpaces(nsPattern).result.forEach(function(ns) {
      var dbObj = { "ns": ns, "indexes": [] }
      getCollection(ns).getIndexes().forEach(function(idx) {
        if (JSON.stringify(idx).match(idxPattern)) {
          dbObj.indexes.push(idx);
        }
      });  
      if(dbObj.indexes.length > 0) {
        ret.result.push(dbObj);
      }
    }); 
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function getNameSpaces(nsPattern) {
  var ret = { ok: 1 }
  ret.result = [];
  try {
    getDatabases().result.forEach(function(database) {
      getDatabase(database).getCollectionNames().forEach(function(collection) {
        var ns = database + '.' + collection;
        if ( nsPattern == null || ns.match(nsPattern) ) {
          ret.result.push(database + '.' + collection)
        }
      })
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function getProfilingStatuses(nsPattern) {
  var ret = { ok: 1 };
  ret.result = [];
  try {
    getDatabases(nsPattern).result.forEach(function(database) {
      var dbObj = { "db": database };
      dbObj.profilingStatus = getDatabase(database).getProfilingStatus();
      ret.result.push(dbObj);
    }); 
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function setProfilingLevels(nsPattern, level, msThreshold) {
  var ret = { ok: 1 }
  ret.result = [];
  if (level == null){
    level = 0;
  }
  if (msThreshold == null){
    msThreshold = 100;
  }
  try {
    getDatabases(nsPattern).result.forEach(function(database) {
      var dbObj = { "db": database } 
      dbObj.profilingStatus = getDatabase(database).setProfilingLevel(level, msThreshold);
      ret.result.push(dbObj);
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function splitNameSpace(namespace) {
  var database = namespace.substr(0,namespace.match(/\./).index);
  var collection = namespace.substr(namespace.match(/\./).index+1);
  return { db: database, col: collection }
}

