
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

const admin = getDatabase('admin');
const config = getDatabase('config');


///////////////////////////////////////////////////////////////////////////////

usage.listSessionsUsage =
`listSessions(namespace)
  Description:
    Returns a list of all sessions minus mms-automation and mms-monitoring.
  Parameters:
    namespace - <db>.<col>
    options - (optional) Options to pass to $listSession. Default: { allUsers: true }
  Returns:
    <collection-object>`;

function listSessions(regex, options = { allUsers: true } ) {
  var ret = { ok: 1, results: [] };

  var skip = ['mms-automation@admin', 'mms-monitoring-agent@admin', 'mms-mongot@admin']
 
  try {
    config.system.sessions.aggregate([{$listSessions: options}]).toArray().forEach((session) => {
      if(session.user && session.user.name && !skip.includes(session.user.name) && JSON.stringify(session).match(regex)){
        ret.results.push(session);
      }
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

///////////////////////////////////////////////////////////////////////////////

usage.listSessionsBySessionIdUsage =
`listSessions(namespace)
  Description:
    Returns a list of all sessions minus mms-automation and mms-monitoring.
  Parameters:
    namespace - <db>.<col>
    options - (optional) Options to pass to $listSession. Default: { allUsers: true }
  Returns:
    <collection-object>`;

function listSessionsBySessionId(regex, options = { allUsers: true } ) {
  var ret = { ok: 1, results: {} };

  var skip = ['mms-automation@admin', 'mms-monitoring-agent@admin', 'mms-mongot@admin']
 
  try {
    config.system.sessions.aggregate([{$listSessions: options}]).toArray().forEach((session) => {
      if(session.user && session.user.name && !skip.includes(session.user.name) && JSON.stringify(session).match(regex)){
        ret.results[session._id.id] = session;
      }
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}


///////////////////////////////////////////////////////////////////////////////
usage.listSessionsByUserIdUsage =
`listSessions(namespace)
  Description:
    Returns a list of all sessions minus mms-automation and mms-monitoring.
  Parameters:
    namespace - <db>.<col>
    options - (optional) Options to pass to $listSession. Default: { allUsers: true }
  Returns:
    <collection-object>`;

function listSessionsByUserId(regex, options = { allUsers: true } ) {
  var ret = { ok: 1, results: {} };

  var skip = ['mms-automation@admin', 'mms-monitoring-agent@admin', 'mms-mongot@admin']
 
  try {
    config.system.sessions.aggregate([{$listSessions: options}]).toArray().forEach((session) => {
      if(session.user && session.user.name && !skip.includes(session.user.name) && JSON.stringify(session).match(regex)){
        if(!ret.results[session.user.name]) {
          ret.results[session.user.name] = [];
        }
        ret.results[session.user.name].push(session);
      }
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
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

function tailLog(logPattern, options = {}) {
  var sRunTime = options.sRunTime;
  var showRate = options.showRate;
  var logs = [];
  var rateCounter = 0;
  var startTime = 0;
  var lastTime = 0;
  var printTime = 0;

  var int = 1000;

  var msRunTime = sRunTime * 1000;
  var dups = 0;

  while(sRunTime === undefined || sRunTime === null || msRunTime > 0) {
    logs = getLog(logPattern).results.log;
    dups = 0;
    logs.forEach(function(val, idx) {
      printTime = ISODate(val.t.$date).getTime();
      if(printTime > lastTime) {
        if(startTime == 0) { startTime = printTime }
        rateCounter += 1;
        print(val);
      } else {
        dups++;
      }
    });

    if(showRate) {
      print ("Rate: " + (rateCounter / ((printTime - startTime)/1000)).toFixed(3) + "/s"); 
    }

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

function getObjectPaths(obj) {
  var paths = [];
  if(typeof(obj) == 'object'
    && obj.constructor.name == 'Array') {
    obj.forEach((el) => {
      if (typeof(el) == 'object') {
        getObjectPaths(el).forEach(function (path) {
          paths.push(path); 
        }); 
      }
    });
  } else {
    Object.keys(obj).sort().forEach(function (key) {
      if(!key.match(/^\$/)) {
        paths.push(key);
      }
      if (typeof(obj[key]) == 'object') {
        getObjectPaths(obj[key]).forEach(function (path) {
          if(!key.match(/^\$/)) {
            paths.push(key + '.' + path); 
          } else {
            paths.push(path); 
          }
        }); 
      }
    });
  }
  return paths;
}

function queryShape(query) {
  var shape;
  if(typeof(query) == 'object'
    && query.constructor.name == 'Array') {
    shape = [];
    query.forEach((el) => {
      shape.push(queryShape(el));
    });
  } else {
    shape = {};
    Object.keys(query).sort().forEach(function (key) {
      shape[key] = typeof(query[key]);
      if(shape[key] == 'object') {
        shape[key] = query[key].constructor.name;
        if(shape[key] == 'Object') {
          shape[key] = queryShape(query[key]);
        }
      }
    });
  }
  return shape;
}

function slowQueries(logPattern, options = {}) {
  var sRunTime = options.sRunTime;
  var showRate = options.showRate;
  var logs = [];
  var rateCounter = 0;
  var startTime = 0;
  var lastTime = 0;
  var printTime = 0;

  var int = 1000;

  var msRunTime = sRunTime * 1000;
  var dups = 0;

  var idxSlowQueries = {};
  var slowQueries = [];

  var slowQuery = {};
  var colWidth = {
    totalTime: 'tTotal'.length,
    avgTime: 'tAvg'.length,
    maxTime: 'tMax'.length,
    minTime: 'tMin'.length,
    count: 'Count'.length,
    ns: 'ns'.length,
    op: 'op'.length,
    plan: 'Plan'.length,
    shape: 'Query Shape'.length
  };

  var op = '';
  var strShape = '';
  var idx = '';
  var db = '';
  var ns = '';
  var plan = '';
  var query = '';
  var qPlan = {};


  while(sRunTime === undefined || sRunTime === null || msRunTime > 0) {
    logs = getLog(logPattern).results.log;
    dups = 0;
    logs.forEach(function(val) {
      printTime = ISODate(val.t.$date).getTime();
      if(printTime > lastTime) {
        if(startTime == 0) { startTime = printTime }
        rateCounter += 1;
        if(val.msg == 'Slow query' && !val.attr.ns.match(/^(admin|local|config)\./) && !Object.keys(val.attr.command).includes('hello')) { 
          if(val.attr.ns.match(/\./)){
            db = splitNameSpace(val.attr.ns).db;
          } else {
            db = ns;
          }

          op = (val.attr.command.find && 'find')
            || (val.attr.command.aggregate && 'aggregate')
            || (val.attr.command.delete && 'delete')
            || (val.attr.command.delete && 'remove')
            || (val.attr.command.insert && 'insert')
            || (val.attr.command.update && 'update');
          ns = db + '.' + val.attr.command[op];
          query = (op == 'find' && val.attr.command.filter )
            || (op == 'insert' && val.attr.command.documents[0])
            || (op == 'aggregate' && val.attr.command.pipeline)
            || (op == 'update' && val.attr.command.updates[0].q)
            || (op == 'delete' && val.attr.command.deletes[0].q)
            || (op == 'remove' && val.attr.command.q);

          strShape = JSON.stringify(queryShape(query));
          idx = op + ':' + strShape;

          if(op) {
            plan = val.attr.planSummary;

            if(!plan) {
              if(op == 'insert') {
                plan = '';
              } else {
                if (op == 'aggregate' && !Object.keys(query[0]).includes('$match')) {
                  plan = 'COLLSCAN';
                } else {
                  query = (op == 'aggregate' && Object.keys(query[0]).includes('$match' && query[0]['$match'])) || query;
                  var qPlan = getCollection(ns).find(query).explain('queryPlanner');
                  plan = (qPlan.queryPlanner.winningPlan.inputStage && qPlan.queryPlanner.winningPlan.inputStage.stage || qPlan.queryPlanner.winningPlan.stage);
                  if(plan != 'COLLSCAN') {
                    plan = plan + ' ' + JSON.stringify((qPlan.queryPlanner.winningPlan.inputStage && qPlan.queryPlanner.winningPlan.inputStage.keyPattern || qPlan.queryPlanner.winningPlan.filter));
                  }
                }
              }
            }

            if(slowQueries[idxSlowQueries[idx]] && slowQueries[idxSlowQueries[idx]].plan != plan) {
              slowQueries.splice(idxSlowQueries[idx], 1);
              delete idxSlowQueries[idx];
            }

            if(Object.keys(idxSlowQueries).includes(idx)){
              slowQuery = slowQueries[idxSlowQueries[idx]];
              slowQuery.count++;
              slowQuery.maxTime = Math.max(slowQuery.maxTime, val.attr.durationMillis);
              slowQuery.minTime = Math.min(slowQuery.minTime, val.attr.durationMillis);
              slowQuery.avgTime = slowQuery.totalTime / slowQuery.count;
              slowQuery.totalTime += val.attr.durationMillis;
            } else {
              slowQuery = {};
              if(op == 'insert') {
                slowQuery.shape = '';
              } else {
                slowQuery.shape = strShape;
              }
              slowQuery.op = op;
              slowQuery.ns = ns;
              slowQuery.count = 1;
              slowQuery.maxTime = val.attr.durationMillis;
              slowQuery.minTime = val.attr.durationMillis;
              slowQuery.totalTime = val.attr.durationMillis;
              slowQuery.avgTime = slowQuery.totalTime / slowQuery.count;
              idxSlowQueries[idx] = slowQueries.push(slowQuery) - 1;
              colWidth.shape = Math.max(colWidth.shape, slowQuery.shape.length);
              colWidth.op = Math.max(colWidth.op, op.length);
              colWidth.ns = Math.max(colWidth.ns, ns.length);
            }
            slowQuery.plan = plan;
            colWidth.totalTime = Math.max(colWidth.totalTime, slowQuery.totalTime.toString().length);
            colWidth.avgTime = Math.max(colWidth.avgTime, slowQuery.avgTime.toString().length);
            colWidth.maxTime = Math.max(colWidth.maxTime, slowQuery.maxTime.toString().length);
            colWidth.minTime = Math.max(colWidth.minTime, slowQuery.minTime.toString().length);
            colWidth.count = Math.max(colWidth.count, slowQuery.count.toString().length);
            colWidth.plan = Math.max(colWidth.plan, slowQuery.plan.length);
          }

        }
      } else {
        dups++;
      }
    });

    slowQueries.sort((a,b) => b.totalTime - a.totalTime);
    slowQueries.forEach((q,i) => {
      idxSlowQueries[q.op + ':' + q.shape] = i;
    });

    print('tTotal'.padStart(colWidth.totalTime) +
        ' | ' + 'tAvg'.padStart(colWidth.avgTime) +
        ' | ' + 'tMax'.padStart(colWidth.maxTime) +
        ' | ' + 'tMin'.padStart(colWidth.minTime) +
        ' | ' + 'Count'.padStart(colWidth.count) +
        ' | ' + 'ns'.padStart(colWidth.ns) +
        ' | ' + 'op'.padStart(colWidth.op) +
        ' | ' + 'Plan'.padEnd(colWidth.plan) +
        ' | Query Shape');
    print("-".padStart(Object.values(colWidth).reduce((pSum, a) => pSum+a, 0) + (Object.keys(colWidth).length * 3),'-'));

    slowQueries.forEach((sq) => {
      print(sq.totalTime.toString().padStart(colWidth.totalTime) +
        ' | ' + sq.avgTime.toString().padStart(colWidth.avgTime) +
        ' | ' + sq.maxTime.toString().padStart(colWidth.maxTime) +
        ' | ' + sq.minTime.toString().padStart(colWidth.minTime) +
        ' | ' + sq.count.toString().padStart(colWidth.count) +
        ' | ' + sq.ns.padEnd(colWidth.ns) +
        ' | ' + sq.op.padEnd(colWidth.op) +
        ' | ' + sq.plan.padEnd(colWidth.plan) +
        ' | ' + sq.shape);
    });

    print("\n\n\n");

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
// FIXIT
usage.changeStream =
`changeStream(ns, pipeline, options, eventHandler)
  Description:
    Executes a change steam and, by default, just prints out change events.
    Pipelines and options can be added along with passing in a function to handle the event.
  Parameters:
    ns - namespace
    pipeline - (optional) A pipeline which will be  passed into watch(); Default: []
    options - (optional) Options passed into watch(); Default: {}
    eventHandler - A function which will be pass the event; Default: function which prints the event`;

function changeStream(ns, pipeline = [], options = {}, eventHandler = function(event){print(JSON.stringify(event,null,2)); }) {
  var ret = { ok: 1, results: [] };
  try {
    const collection = getCollection(ns);
    var cursor = collection.watch(pipeline, options);

    while(!cursor.isClosed()){
      let next = cursor.tryNext();
      while(next !== null) {
        eventHandler(next);
        //printjson(next);
        next = cursor.tryNext();
      }
    }
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
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

function getLog (logPattern, options = { type: 'global' } ) {
  var ret = { ok: 1 };
  try {
    var sessions = listSessionsBySessionId().results;
    var log = getDatabase('admin').adminCommand({ getLog: options.type });
    if("log" in log) {
      var logs = log.log;
      log.log = [];
      var item = {};
      logs.forEach(function (entry) {
        item = JSON.parse(entry);
        if(item.attr && item.attr.command && item.attr.command.lsid && item.attr.command.lsid.id && item.attr.command.lsid.id['$uuid']) {
          if(sessions[item.attr.command.lsid.id['$uuid']]) {
            // If we can match the session ID to the user then add the user in
            item.attr.user = sessions[item.attr.command.lsid.id['$uuid']].user;
          }
        }
        if (JSON.stringify(item).match(logPattern)) {
          log.log.push(item);
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
