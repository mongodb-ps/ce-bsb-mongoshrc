
function pluginHelp(pattern) {
  print(".mongoshrc Plug In Help:\n");
  if('dropCollections'.match(pattern)) {
    print("  dropCollections(nsPattern)");
    print("    Description:");
    print("      Drops multiple collections depending on the regex pattern matching the namespace.");
    print("      Use getCollections() to confirm collections to be dropped.");
    print("    Parameters:");
    print("      nsPattern - regex/string to limit collections/namespaces dropped");
    print("    Returns:");
    print("      [ { ok: ..., err: <error>, results: [ { db: <db>, cols: [ { col: <col>, dropped: <result> } ] } ] } ]\n");
  }
  if('dropDatabases'.match(pattern)) {
    print("  dropDatabases(pattern)");
    print("    Description:");
    print("      Drops multiple databases depending on the regex pattern matching database name.");
    print("      Use getDatabases() to confirm databases to be dropped.");
    print("    Parameters:");
    print("      pattern - regex/string to limit databases dropped");
    print("    Returns:");
    print("      [ { ok: ..., err: <error>, results: [ { ok: 1, dropped: 'sample_weatherdata' } ] } ]\n");
    print("      \n");
  }
  if('dropIndexes'.match(nsPattern, idxPattern)) {
    print("  dropIndexes(pattern)");
    print("    Description:");
    print("      Drops multiple indexes across namespaces matching the nsPattern (regex) and");
    print("      matching the idxPattern such as name or option.");
    print("      Use getIndexes() to confirm indexes to be dropped.");
    print("    Parameters:");
    print("      nsPattern - regex/string to limit namespaces");
    print("      idxPattern - regex/string to indexes");
    print("    Returns:");
    print("      [ { ok: ..., err: <error>, result: { ns: <namespace>, result: [ { nIndexesWas: ..., ok: ..., '$clusterTime': { clusterTime: ..., signature: ..., keyId: ...  } }, operationTime: ...  } ] } } ]\n");
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
  var ret = { ok: 1, results: [] }
  try {
    getCollections(nsPattern).results.forEach(function(dbObjIn) {
      var db = dbObjIn.db;
      var dbObjOut = { db: db, cols: [] };
      dbObjIn.cols.forEach(function(col) {
        dbObjOut.cols.push({ col: col, dropped: getCollection(db + '.' + col).drop() });
      });
      if(dbObjOut.cols.length > 0) {
        ret.results.push(dbObjOut);
      }
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function dropDatabases(pattern) {
  var ret = { ok: 1, results: [] };
  try {
    getDatabases(pattern).results.forEach(function(database) {
      ret.results.push(getDatabase(database).dropDatabase());
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
    getIndexes(nsPattern, idxPattern).results.forEach(function(nsObj) {
      var dbObj = { "ns": nsObj.ns, results: [] }
      nsObj.indexes.forEach(function(idx) {
        if(idx.name !== '_id_') {
          dbObj.results.push(getCollection(nsObj.ns).dropIndex(idx.name));
        }
      }); 
      ret.results.push(dbObj);
    });
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

function getCollections(nsPattern) {
  var ret = { ok: 1 }
  ret.results = [];
  try {
    getDatabases().results.forEach(function(database) {
      var dbObj = { "db": database, "cols": [] }
      getDatabase(database).getCollectionNames().forEach(function(collection) {
        var ns = database + '.' + collection;
        if ( nsPattern == null || ns.match(nsPattern) ) {
          dbObj.cols.push(collection)
        }
      });
      if (dbObj.cols.length > 0) {
        ret.results.push(dbObj);
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
  ret.results = [];
  try {
    db.getMongo().getDBNames().forEach(function(database) {
      if (database != 'admin' && database != 'local' && database != 'config' && dbPattern !== null && database.match(dbPattern)) {
        ret.results.push(database);
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
  ret.results = [];
  try {
    getNameSpaces(nsPattern).results.forEach(function(ns) {
      var dbObj = { "ns": ns, "indexes": [] }
      getCollection(ns).getIndexes().forEach(function(idx) {
        if (JSON.stringify(idx).match(idxPattern)) {
          dbObj.indexes.push(idx);
        }
      });  
      if(dbObj.indexes.length > 0) {
        ret.results.push(dbObj);
      }
    }); 
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function getIndexStats(nsPattern, idxPattern) {
  var ret = { ok: 1 }
  ret.results = [];
  try {
    getNameSpaces(nsPattern).results.forEach(function(ns) {
      var dbObj = { "ns": ns, "indexes": [] }
      getCollection(ns).aggregate([{$indexStats:{}}]).forEach(function(idx) {
        if (JSON.stringify(idx).match(idxPattern)) {
          dbObj.indexes.push(idx);
        }
      });  
      if(dbObj.indexes.length > 0) {
        ret.results.push(dbObj);
      }
    }); 
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function getUnusedIndexes(nsPattern) {
  var ret = { ok: 1 }
  ret.results = [];
  try {
    getNameSpaces(nsPattern).results.forEach(function(ns) {
      var dbObj = { "ns": ns, "indexes": [] }
      getCollection(ns).aggregate([{$indexStats:{}}]).forEach(function(idx) {
        if (JSON.stringify(idx).match(/"accesses":{"ops":{"low":0,"high":0,"unsigned":false}/)) {
          dbObj.indexes.push(idx);
        }
      });  
      if(dbObj.indexes.length > 0) {
        ret.results.push(dbObj);
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
  ret.results = [];
  try {
    getDatabases().results.forEach(function(database) {
      getDatabase(database).getCollectionNames().forEach(function(collection) {
        var ns = database + '.' + collection;
        if ( nsPattern == null || ns.match(nsPattern) ) {
          ret.results.push(database + '.' + collection)
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
  ret.results = [];
  try {
    getDatabases(nsPattern).results.forEach(function(database) {
      var dbObj = { "db": database };
      dbObj.profilingStatus = getDatabase(database).getProfilingStatus();
      ret.results.push(dbObj);
    }); 
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function setProfilingLevels(nsPattern, level, msThreshold) {
  var ret = { ok: 1 }
  ret.results = [];
  if (level == null){
    level = 0;
  }
  if (msThreshold == null){
    msThreshold = 100;
  }
  try {
    getDatabases(nsPattern).results.forEach(function(database) {
      var dbObj = { "db": database } 
      dbObj.profilingStatus = getDatabase(database).setProfilingLevel(level, msThreshold);
      ret.results.push(dbObj);
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

