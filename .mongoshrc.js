
print(`
Type 'getHelp()' to list usage.
Type 'getHelp(<regex>) to get specific usage for functions.
`);

var usage = {};

function getHelp(pattern) {
  Object.keys(usage).sort().forEach(function (fnc) {
    if(fnc.match(pattern)) {
      print('-----');
      print(usage[fnc]);
    }
  });
  print('-----');
}

// Utilities
function dbRunCommand(optDocument)
{
  return getDatabase('admin').runCommand(optDocument);
}

function dbAdminCommand(optDocument)
{
  return getDatabase('admin').adminCommand(optDocument);
}

///////////////////////////////////////////////////////////////////////////////

usage.getCollectionUsage =
`getCollection(namespace)
  Description:
    Gets a collection object based upon the namespace.
  Parameters:
    namespace - <db>.<col>
  Returns:
    <collection-object>`;

function getCollection(namespace) {
  var ns = splitNameSpace(namespace)
  if (ns.db !== null && ns.col !== null) {
    collection = getDatabase(ns.db)[ns.col];
  }
  return collection;
}

///////////////////////////////////////////////////////////////////////////////

usage.setDatabaseUsage =
`getDatabase(database)
  Description:
    Gets a database object based upon the namespace.
  Parameters:
    database - <db>
  Returns:
    <database-object>`;

function getDatabase(database) {
  return db.getSiblingDB(database);
}

///////////////////////////////////////////////////////////////////////////////


// Get/Drop commands

///////////////////////////////////////////////////////////////////////////////

usage.dropCollections =
`dropCollections(nsPattern)
  Description:
    Drops multiple collections depending on the regex pattern matching the namespace.
    Use getCollections() to confirm collections to be dropped.
  Parameters:
    nsPattern - regex/string to limit collections/namespaces dropped
  Returns:
    { ok: ..., err: <error>, results: [ { db: <db>, cols: [ { col: <col>, dropped: <result> } ] } ] }
  WARNING: THIS DOES NOT PROMPT FOR CONFIRMATION.`;

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

///////////////////////////////////////////////////////////////////////////////

usage.dropDatabases =
`dropDatabases(pattern)
  Description:
    Drops multiple databases depending on the regex pattern matching database name.
    Use getDatabases() to confirm databases to be dropped.
  Parameters:
    pattern - regex/string to limit databases dropped
  Returns:
    { ok: ..., err: <error>, results: [ { ok: 1, dropped: <db> } ] }
  WARNING: THIS DOES NOT PROMPT FOR CONFIRMATION.`;

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

///////////////////////////////////////////////////////////////////////////////

usage.dropIndexes = 
`dropIndexes(nsPattern, idxPattern)
   Description:
     Drops multiple indexes across namespaces matching the nsPattern (regex) and
     matching the idxPattern such as name or option.
     Use getIndexes() to confirm indexes to be dropped.
   Parameters:
     nsPattern - regex/string to limit namespaces
     idxPattern - regex/string to indexes
   Returns:
     { ok: ..., err: <error>, results: { ns: <namespace>, result: [ { nIndexesWas: ..., ok: ..., "$clusterTime": { clusterTime: ..., signature: ..., keyId: ...  } }, operationTime: ...  } ] }
   WARNING: THIS DOES NOT PROMPT FOR CONFIRMATION.`;

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

///////////////////////////////////////////////////////////////////////////////

usage.getCollections =
`getCollections(nsPattern)
  Description:
    Get collections based upon the namespace pattern (regex).
  Parameters:
    nsPattern - regex/string to limit databases/collections returned
  Returns:
    { ok: ..., err: <error>, results: [ { db: <db>, cols: [ <col>, ... ] } }`;

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

///////////////////////////////////////////////////////////////////////////////

function getEstimatedDocumentCounts(nsPattern) {
  var ret = { ok: 1 }
  ret.results = [];
  try {
    getNameSpaces(nsPattern).results.forEach(function(namespace) {
      ret.results.push({ "ns": namespace, "count": getCollection(namespace).estimatedDocumentCount() });
    }); 
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

///////////////////////////////////////////////////////////////////////////////

usage.getDatabasesUsage =
`getDatabases(dbPattern)
  Description:
    Get databases based upon the dbPattern (regex).
  Parameters:
    dbPattern - regex/string to limit databases returned
  Returns:
    { ok: ..., err: <error>, results: [<db>, ...] }`;

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

///////////////////////////////////////////////////////////////////////////////

usage.getIndexes =
`getIndexes(nsPattern, idxPattern)
  Description:
    Get indexes based upon the nsPattern (regex).
    idxPattern allows you to scan the index for the name, parameters, etc.
  Parameters:
    nsPattern - regex/string to limit namespaces
    idxPattern - regex/string to limit indexes
  Returns:
    { ok: ..., err: <error>, results: [ { ns: <db>.<col>, indexes: [ <index>, ... ] } ] }`;

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

///////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////

usage.getNameSpaces = 
`getNameSpaces(nsPattern)
  Description:
    Get namespaces based upon the nsPattern (regex).
  Parameters:
    nsPattern - regex/string to limit databases returned
  Returns:
    { ok: ..., err: <error>, results: [ <ns>, ... ] }`;

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

///////////////////////////////////////////////////////////////////////////////

usage.getProfilingStatus =
`getProfilingStatuses(nsPattern)
  Description:
    Gets the profiling status for all namespaces based upon the nsPattern (regex).
  Parameters:
    nsPattern - regex/string to limit databases
  Returns:
    { ok: ..., err: <error>, results: [ { db: <db>, profilingStatus: <profilingStatus> } ] }`;

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

///////////////////////////////////////////////////////////////////////////////

usage.setProfilingLevel =
`setProfilingLevels(nsPattern)
  Description:
    Sets the profiling status for all namespaces based upon the nsPattern (regex).
  Parameters:
    nsPattern - regex/string to limit databases returned
  Returns:
    { ok: ..., err: <error>, results: [ { db: <db>, profilingStatus: <profilingStatus> } ] }`;

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

///////////////////////////////////////////////////////////////////////////////

usage.dbFind =
`dbFind(nsPattern, query, proj, sort)
  Description:
    Runs a query across namespaces based upon the nsPattern (regex).
  Parameters:
    nsPattern - regex/string to limit namespaces
    query     - (optional) query to run against each namespace
    proj      - (optional) projection of the results
    sort      - (optional) sort the results for each query
  Returns:
    { ok: ..., err: <error>, results: [ { ns: <ns>, results: [<query-results>] ] }`;

function dbFind(nsPattern, query = {}, proj = {}, sort = {}) {
  var ret = { ok: 1, results: [] };
  try {
    getNameSpaces(nsPattern).results.forEach(function(ns) {
      ret.results.push({ "ns": ns, results: getCollection(ns).find(query, proj).sort(sort).toArray() });
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

///////////////////////////////////////////////////////////////////////////////

function splitNameSpace(namespace) {
  var database = namespace.substr(0,namespace.match(/\./).index);
  var collection = namespace.substr(namespace.match(/\./).index+1);
  return { db: database, col: collection }
}

///////////////////////////////////////////////////////////////////////////////

usage.getCreateIndexCommands =
`getCreateIndexCommands(nsPattern, idxPattern)
  Description:
    Gets the index creation commands based upon the namespace pattern and index pattern.
  Parameters:
    nsPattern - regex/string to limit to specific namespaces
    idxPattern - regex/string to limit to specific indexes or types of indexes
  Returns:
    { ok: ..., err: <error>, results: [ { ns: <namespace>, commands: [ <create-index-command>, ...]  } ], string: <create-index-commands> }`;

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

///////////////////////////////////////////////////////////////////////////////

usage.setBalancing =
`setBalancing(nsPattern, enable)
  Description:
    Enables/Disables balancing for namespaces based upon the nsPattern (regex).
  Parameters:
    nsPattern - regex/string to limit databases returned
    enable - boolean - true/false
  Returns:
    { ok: ..., err: <error>, results: [ { db: <db>, results: <enable/disable-result> } ] }`;

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

///////////////////////////////////////////////////////////////////////////////

usage.tailLog =
`tailLog(logPattern, sRunTime)
  Description:
    Tails the internal log for sRunTime seconds looking for logPattern
  Parameters:
    logPattern - regex/string used to match the log entry
    sRunTime - Seconds to run before exiting; omit to run continuously
  Prints:
    <log-entry>
    ...`;

function tailLog(logPattern, sRunTime) {
  var logs = [];
  var lastTime = ISODate();
  lastTime.setTime(0);
  var printTime = ISODate();
  printTime.setTime(0);

  var int = 1000;

  var msRunTime = sRunTime * 1000;
  var dups = 0;

  while(sRunTime === undefined || sRunTime === null || msRunTime > 0) {
    logs = getLog(logPattern).results.log;

    dups = 0;
    logs.forEach(function(val, idx) {
      printTime = ISODate(val.t.$date);
      if(printTime.getTime() > lastTime.getTime()) {
        print(val);
      } else {
        dups++;
      }
    });

    if(logs.length < 1024) {
      int = 1000;
    } else {
      int = dups;
    }

    sleep(int);
    if (sRunTime !== undefined && sRunTime !== null) {
      msRunTime -= int;
    }
    lastTime = printTime;
  }
}

///////////////////////////////////////////////////////////////////////////////

usage.watchCounts =
`watchCounts(nsPattern, sRunTime, msPollTime)
  Description:
    Calls watchEstimatedDocumentCounts()
    Watches the count changes on collections matching the pattern.
  Parameters:
    nsPattern - regex/string used to select databases/collections to watch
    sRunTime - Seconds to run before exiting; omit to run continuously
    msPollTime - ms between polling for counts (default: 1000)
  Prints:
    {
      ns: <namespace>,
      last: <integer>,
      count: <integer>,
      rate: <integer>,
      start: <integer>,
      change: <integer>
    }
    ...`;

function watchCounts(nsPattern, sRunTime, msPollTime = 1000) {
  return watchEstimatedDocumentCounts(nsPattern, sRunTime, msPollTime);
}

///////////////////////////////////////////////////////////////////////////////

usage.watchEstimatedDocumentCounts =
`watchEstimatedDocumentCounts(nsPattern, sRunTime, msPollTime)
  Description:
    Watches the count changes on collections matching the pattern.
  Parameters:
    nsPattern - regex/string used to select databases/collections to watch
    sRunTime - Seconds to run before exiting; omit to run continuously
    msPollTime - ms between polling for counts (default: 1000)
  Prints:
    {
      ns: <namespace>,
      last: <integer>,
      count: <integer>,
      rate: <integer>,
      start: <integer>,
      change: <integer>
    }
    ...`;

function watchEstimatedDocumentCounts(nsPattern, sRunTime, msPollTime = 1000) {
  var logs = [];
  var int = 1000;
  var pTime = ISODate();
  pTime.setTime(0);

  var msRunTime = sRunTime * 1000;
  var counts = [];

  while(sRunTime === undefined || sRunTime === null || msRunTime > 0) {
    var latestCounts = getEstimatedDocumentCounts(nsPattern).results;

    latestCounts.forEach(function (item, idx) {
      if (counts[idx] === undefined) {
        counts[idx] = {};
      }
      counts[idx].ns = item.ns; 
      counts[idx].last = counts[idx].count;
      counts[idx].count = item.count; 
      counts[idx].rate = counts[idx].count - counts[idx].last;
      if (!("start" in counts[idx])) {
        counts[idx].start = item.count;
      }
      counts[idx].change = item.count - counts[idx].start;
    });

    counts.forEach(function (item) {
      print (item);
    });

    sleep(msPollTime);
    if (sRunTime !== undefined && sRunTime !== null) {
      msRunTime -= msPollTime;
    }
  }
}

///////////////////////////////////////////////////////////////////////////////

// Keyhole

function getBuildInfo() {
  var ret = { ok: 1 };
  try {
    ret.results = getDatabase('admin').runCommand({ buildInfo: 1});
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

// FIXIT
function getCollStats(nsPattern) {
  var ret = { ok: 1 };
  try {
//    ret.results = getDatabase('admin').runCommand({ buildInfo: 1});
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

// FIXIT: Catch sharded cluster!
function getConnPoolStats() {
  var ret = { ok: 1, results: [] };
  try {
    ret.results = getDatabase('admin').adminCommand({ getCmdLineOpts: 1 });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

function getHostInfo () {
  var ret = { ok: 1 };
  try {
    ret.results = getDatabase('admin').adminCommand({ hostInfo: 1});
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

function getLog (logPattern, type = 'global') {
  var ret = { ok: 1 };
  try {
    var log = getDatabase('admin').adminCommand({ getLog: type });
    if("log" in log) {
      var logs = log.log;
      log.log = [];
      logs.forEach(function (entry) {
        if (entry.match(logPattern)) {
          log.log.push(JSON.parse(entry));
        }
      });
    }
    ret.results = log;
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

function getStartupWarnings () {
  var ret = { ok: 1 };
  try {
    ret.results = getDatabase('admin').adminCommand({ getLog: 'startupWarnings' });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

function getCmdLineOpts () {
  var ret = { ok: 1 };
  try {
    ret.results = getDatabase('admin').adminCommand({ getCmdLineOpts: 1 });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 

}

function getBuildInfo() {
  var ret = { ok: 1 };
  try {
    ret.results = getDatabase('admin').runCommand({ buildInfo: 1 });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

function diffTime(endTime, startTime) {
  return (endTime.getTime() - startTime.getTime());
}

function addTime(startTime, seconds) {
  var retTime = ISODate();
  retTime.setTime(startTime.getTime() + seconds);
  return retTime;
}

function getStableAPIStatus() {
  var ret = { ok: 1, results: {} }
  
  var apiStatus = db.serverStatus().metrics.apiVersions;
 
  Object.keys(apiStatus).forEach(function (app) {
    apiStatus[app].forEach(function (ver) {
      if (! (ver in ret.results)){
        ret.results[ver] = [];
      }
      ret.results[ver].push(app);
    });
  });
  return ret;
}
