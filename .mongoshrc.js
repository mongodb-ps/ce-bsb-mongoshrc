
function getHelp(pattern) {
  print(".mongoshrc Plug In Help:\n");
  if('dropCollections'.match(pattern)) {
    print('  dropCollections(nsPattern)');
    print('    Description:');
    print('      Drops multiple collections depending on the regex pattern matching the namespace.');
    print('      Use getCollections() to confirm collections to be dropped.');
    print('    Parameters:');
    print('      nsPattern - regex/string to limit collections/namespaces dropped');
    print('    Returns:');
    print('      { ok: ..., err: <error>, results: [ { db: <db>, cols: [ { col: <col>, dropped: <result> } ] } ] }\n');
  }
  if('dropDatabases'.match(pattern)) {
    print('  dropDatabases(pattern)');
    print('    Description:');
    print('      Drops multiple databases depending on the regex pattern matching database name.');
    print('      Use getDatabases() to confirm databases to be dropped.');
    print('    Parameters:');
    print('      pattern - regex/string to limit databases dropped');
    print('    Returns:');
    print('      { ok: ..., err: <error>, results: [ { ok: 1, dropped: <db> } ] }\n');
    print('      \n');
  }
  if('dropIndexes'.match(pattern)) {
    print('  dropIndexes(nsPattern, idxPattern)');
    print('    Description:');
    print('      Drops multiple indexes across namespaces matching the nsPattern (regex) and');
    print('      matching the idxPattern such as name or option.');
    print('      Use getIndexes() to confirm indexes to be dropped.');
    print('    Parameters:');
    print('      nsPattern - regex/string to limit namespaces');
    print('      idxPattern - regex/string to indexes');
    print('    Returns:');
    print('      { ok: ..., err: <error>, results: { ns: <namespace>, result: [ { nIndexesWas: ..., ok: ..., "$clusterTime": { clusterTime: ..., signature: ..., keyId: ...  } }, operationTime: ...  } ] }\n');
  }
  if('getCollection'.match(pattern)) {
    print("  getCollection(namespace)");
    print("    Description:");
    print("      Gets a collection based upon the namespace.");
    print("    Parameters:");
    print("      namespace - <db>.<col>");
    print("    Returns:");
    print("      <collectionObject>\n");
  }
  if('getCollections'.match(pattern)) {
    print('  getCollections(nsPattern)');
    print('    Description:');
    print('      Get collections based upon the namespace pattern (regex).');
    print('    Parameters:');
    print('      nsPattern - regex/string to limit databases/collections returned');
    print('    Returns:');
    print('      { ok: ..., err: <error>, results: [ { db: <db>, cols: [ <col>, ... ] } }\n');
  }
  if('getCreateIndexCommands'.match(pattern)) {
    print("  setProfilingLevels(nsPattern)");
    print("    Description:");
    print("      Sets the profiling status for all namespaces based upon the nsPattern (regex).");
    print("    Parameters:");
    print("      nsPattern - regex/string to limit databases returned");
    print("    Returns:");
    print("      { ok: ..., err: <error>, results: [ { db: <db>, profilingStatus: <profilingStatus> } ] }\n");
  }
  if('getDatabases'.match(pattern)) {
    print("  getDatabases(dbPattern)");
    print("    Description:");
    print("      Get databases based upon the dbPattern (regex).");
    print("    Parameters:");
    print("      dbPattern - regex/string to limit databases returned");
    print("    Returns:");
    print("      { ok: ..., err: <error>, results: [<db>, ...] }\n");
  }
  if('getIndexes'.match(pattern)) {
    print("  getIndexes(nsPattern, idxPattern)");
    print("    Description:");
    print("      Get indexes based upon the nsPattern (regex).");
    print("      idxPattern allows you to scan the index for the name, parameters, etc.");
    print("    Parameters:");
    print("      nsPattern - regex/string to limit namespaces");
    print("      idxPattern - regex/string to limit indexes");
    print("    Returns:");
    print("      { ok: ..., err: <error>, results: [ { ns: <db>.<col>, indexes: [ <index>, ... ] } ] }\n");
  }
  if('getNameSpaces'.match(pattern)) {
    print("  getNameSpaces(nsPattern)");
    print("    Description:");
    print("      Get namespaces based upon the nsPattern (regex).");
    print("    Parameters:");
    print("      nsPattern - regex/string to limit databases returned");
    print("    Returns:");
    print("      { ok: ..., err: <error>, results: [ <ns>, ... ] }\n");
  }
  if('getProfilingStatus'.match(pattern)) {
    print("  getProfilingStatuses(nsPattern)");
    print("    Description:");
    print("      Gets the profiling status for all namespaces based upon the nsPattern (regex).");
    print("    Parameters:");
    print("      nsPattern - regex/string to limit databases");
    print("    Returns:");
    print("      { ok: ..., err: <error>, results: [ { db: <db>, profilingStatus: <profilingStatus> } ] }\n");
  }
  if('setBalancing'.match(pattern)) {
    print("  setBalancing(nsPattern, enable)");
    print("    Description:");
    print("      Enables/Disables balancing for namespaces based upon the nsPattern (regex).");
    print("    Parameters:");
    print("      nsPattern - regex/string to limit databases returned");
    print("      enable - boolean - true/false");
    print("    Returns:");
    print("      { ok: ..., err: <error>, results: [ { db: <db>, results: <enable/disable-result> } ] }\n");
  }
  if('setProfilingLevel'.match(pattern)) {
    print("  setProfilingLevels(nsPattern)");
    print("    Description:");
    print("      Sets the profiling status for all namespaces based upon the nsPattern (regex).");
    print("    Parameters:");
    print("      nsPattern - regex/string to limit databases returned");
    print("    Returns:");
    print("      { ok: ..., err: <error>, results: [ { db: <db>, profilingStatus: <profilingStatus> } ] }\n");
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
  var ret = { ok: 1, results: [] };
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

function getCreateIndexCommands(nsPattern, idxPattern) {
  var ret = { ok: 1, results: [], string: '' };
  getIndexes(nsPattern, idxPattern).results.forEach(function(namespace) {
    var result = { ns: namespace.ns, commands: [] };
    var ns = splitNameSpace(namespace.ns)
    namespace.indexes.forEach(function(index) {
      if(index.name !== '_id_') {
        delete index.v;
        idxKey = index.key;
        delete index.key;
        command = 'db.getSiblingDB("' + ns.db + '").' + ns.col + '.createIndex(' + JSON.stringify(idxKey) + ',' + JSON.stringify(index) + ')';
        result.commands.push(command);
        ret.string += command + "\n";
      }
    });
    if(result.commands.length > 0){
      ret.results.push(result);
    }
  });
  return ret;
}

function setBalancing(nsPattern, enable) {
  var ret = { ok: 1, results: [] };
  try {
    getNameSpaces(nsPattern).results.forEach(function(ns) {
      stats = getCollection(ns).stats()
      if (stats.hasOwnProperty('shards') ) {
        if(enable === true) {
          ret.results.push(sh.enableBalancing(ns));
        } else {
          ret.results.push(sh.disableBalancing(ns));
        }
      }
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

//function getTTLIndexSettings() {
//  db.getMongo().getDBNames().forEach(function(database) {
//  if (database != 'admin' && database != 'local' && database != 'config') {
//    db.getSiblingDB(database).getCollectionNames().forEach(function(collection) {
//      indexes = db.getSiblingDB(database)[collection].getIndexes()
//      indexes.forEach(function(index) {
//        if(index.hasOwnProperty('expireAfterSeconds')){
//          command = {
//            collMod: collection,
//            index: {
//              keyPattern: index.key,
//              expireAfterSeconds: index.expireAfterSeconds
//            }
//          }
//          print('db.getSiblingDB("' + database + '").runCommand(' + JSON.stringify(command) + ')');
//        }
//      });
//    });
//  }});
//}

//db.runCommand(
//  {
//    collMod: <collection>,
//    index: {
//      keyPattern: { <field>: 1 },
//      expireAfterSeconds: <secs>
//    }
//  }
//)

