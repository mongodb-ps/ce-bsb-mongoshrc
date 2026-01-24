/*
Next:
- getBalancing()
- balancerCollectionStatus()
- presplitting
- currentOps
- remove dups
- copy database
- copy collection
- clusterType (sharded / replica)
- mongoexport / mongoimport
- mongodump / mongorestore
- presplit
- time machine
*/

// CONFIG
config.set( "editor", "vi" )
config.set( "inspectDepth", "Infinity" )

const os = require('os');
const fs = require('fs');
const homeDir = os.homedir();

const maxAtlasSearchDocuments=2000000000;

print(`
Type 'getHelp()' to list usage.
Type 'getHelp(<regex>) to get specific usage for functions.
`);

const dbStart = db;

var usage = {};

// WARNING: DESTRUCTIVE MODULE
const MONGOSH_PLUGIN = process.env.MONGOSH_PLUGIN

// If the MONGOSH environment variable is set to 'EXPERT'
// then load mutable functions like drop*()
if(MONGOSH_PLUGIN == 'EXPERT') {
  print(`EXPERT MODE ENABLED! BE CAREFUL!!!`);

  load(homeDir + "/.mongoshrc-expert.js");
} else {
  print(`Set environment variable, MONGOSH_PLUGIN, to EXPERT to get drop*() functions.`);
}

// Date w/o Time
Date.prototype.getDateWithoutTime = function () {
    return new Date(this.toDateString());
}

// Place for static data for each instanace;
var static = { };
var dynamic = { };
dynamic.timestamps = { };

// HELP
usage.getHelp  =
`getHelp(pattern)
  Description:
    Returns a list of all functions matching the pattern passed.
  Parameters:
    patter - String which matches the function name(s)
  Returns:
    Prints usage for functions matching the pattern given.`;

function getHelp(pattern) {
  Object.keys(usage).sort().forEach(function (fnc) {
    if(fnc.match(pattern)) {
      print('-----');
      print(usage[fnc]);
    }
  });
  print('-----');
}

// HELP
usage.reload  =
`reload()
  Description:
    Reloads the plugin.
  Parameters:
    <none>
  Returns:
    <nothing>`;

function reload() {
  load('.mongoshrc.js');
}

// Utilities

usage.login  =
`login()
  Description:
    Stores credentials in session variables.
    Used when needing to connect to other nodes in the cluster.
  Returns:
    N/A.`;

function login()
{
  static['password'] = passwordPrompt();
}

usage.clearPassword  =
`clearPassword()
  Description:
    Removes password from being stored internally in the session.
  Returns:
    N/A.`;

function clearPassword()
{
  delete static['password'];
}

usage.dbRunCommand  =
`dbRunCommand(document, options)
  Description:
    runs db.runCommand(document, options)
  Parameters:
    document - command document
    options - options for how db.RunCommand runs the command.
  Returns:
    Results of command run.`;

function dbRunCommand(document)
{
  return getDatabase('admin').runCommand(document);
}

usage.dbAdminCommand  =
`dbAdminCommand(document)
  Description:
    runs db.adminCommand(document)
  Parameters:
    document - command document
  Returns:
    Results of command run.`;

function dbAdminCommand(document)
{
  return getDatabase('admin').adminCommand(document);
}

///////////////////////////////////////////////////////////////////////////////

usage.decodeObjectId  =
`decodeObjectId(objId)
  Description:
    Breaks the ObjectId down to its individual components
  Parameters:
    objId - an ObjectId
  Returns:
    Time, random number for machine/process, and counter encoded in the ObjectId.`;

function decodeObjectId(objId) {
  var ret = { ok: 1, result: {} };
  try {
    ret.result.time = parseInt(objId.toString().substring(0,8),16) * 1000;  
    ret.result.random = parseInt(objId.toString().substring(8,18),16);  
    ret.result.counter = parseInt(objId.toString().substring(18,24),16);  
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

///////////////////////////////////////////////////////////////////////////////

usage.getTimestamp  =
`getTimestamp(epoch = , count = 1)
  Description:
    Returns a current timestamp. Includes counter.
  Parameters:
    epoch - seconds since 1970-01-01T00:00:00
  Returns:
    Timestamp.`;


function getTimestamp(epoch = parseInt(new Date().getTime()/1000), count) {
  if(count === undefined) {
    if(epoch in dynamic.timestamps) {
      count = ++dynamic.timestamps[epoch];
    } else {
      count = dynamic.timestamps[epoch] = 1;
    }
  }
  return new Timestamp(epoch,count);
}

///////////////////////////////////////////////////////////////////////////////

usage.listSessions =
`listSessions(pattern, options)
  Description:
    Returns a list of all sessions minus mms-automation and mms-monitoring.
  Parameters:
    pattern - Regex pattern to search for
    options - (optional) Options to pass to $listSession. Default: { allUsers: true }
  Returns:
    { ok: ..., err: <error>, result: [ <session-info> ] }`;

function listSessions(pattern, options = { allUsers: true } ) {
  var ret = { ok: 1, result: [] };

  var skip = ['mms-automation@admin', 'mms-monitoring-agent@admin', 'mms-mongot@admin']
 
  try {
    getDatabase('config').system.sessions.aggregate([{$listSessions: options}]).toArray().forEach((session) => {
      if(session.user && session.user.name && !skip.includes(session.user.name) && JSON.stringify(session).match(pattern)){
        ret.result.push(session);
      }
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

///////////////////////////////////////////////////////////////////////////////

usage.listSessionsBySessionId =
`listSessionsBySessionId(pattern, options)
  Description:
    Returns a list of all sessions minus mms-automation and mms-monitoring.
  Parameters:
    pattern - Regex pattern to search for.
    options - (optional) Options to pass to $listSession. Default: { allUsers: true }
  Returns:
    { ok: ..., err: <error>, result: { sessionId: <session-info> } }`;

function listSessionsBySessionId(pattern, options = { allUsers: true } ) {
  var ret = { ok: 1, result: {} };

  var skip = ['mms-automation@admin', 'mms-monitoring-agent@admin', 'mms-mongot@admin']
 
  try {
    listSessions(pattern, options).result.forEach((session) => {
      if(session.user && session.user.name && !skip.includes(session.user.name) && JSON.stringify(session).match(pattern)){
        ret.result[session._id.id] = session;
      }
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

///////////////////////////////////////////////////////////////////////////////
usage.listSessionsByUserId =
`listSessionsByUserId(pattern, options)
  Description:
    Returns a list of all sessions by user Id minus mms-automation and mms-monitoring.
  Parameters:
    pattern - Regex pattern to search for.
    options - (optional) Options to pass to $listSession. Default: { allUsers: true }
  Returns:
    { ok: ..., err: <error>, result: { userId: [ <session-info>, ... ] } }`;

function listSessionsByUserId(pattern, options = { allUsers: true } ) {
  var ret = { ok: 1, result: {} };

  var skip = ['mms-automation@admin', 'mms-monitoring-agent@admin', 'mms-mongot@admin']
 
  try {
    listSessions(pattern, options).result.forEach((session) => {
      if(session.user && session.user.name && !skip.includes(session.user.name) && JSON.stringify(session).match(pattern)){
        if(!ret.result[session.user.name]) {
          ret.result[session.user.name] = [];
        }
        ret.result[session.user.name].push(session);
      }
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}


///////////////////////////////////////////////////////////////////////////////

usage.getCollection =
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

usage.getDatabase =
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
// Get commands
///////////////////////////////////////////////////////////////////////////////

usage.getCollections =
`getCollections(nsPattern)
  Description:
    Get collections based upon the namespace pattern (regex).
  Parameters:
    nsPattern - regex/string to limit databases/collections returned
  Returns:
    { ok: ..., err: <error>, result: [ { db: <db>, cols: [ <col>, ... ] } ] }`;

function getCollections(nsPattern) {
  var ret = { ok: 1 }
  ret.result = [];
  try {
    getDatabases().result.forEach(function(database) {
      var dbObj = { "db": database, "cols": [] }
      getDatabase(database).getCollectionNames().forEach(function(collection) {
        var ns = database + '.' + collection;
        if ( nsPattern == null || ns.match(nsPattern) ) {
          dbObj.cols.push(collection)
        }
      });
      if (dbObj.cols.length > 0) {
        ret.result.push(dbObj);
      }
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

///////////////////////////////////////////////////////////////////////////////

usage.getEstimatedDocumentCounts =
`getEstimatedDocumentCounts(nsPattern)
  Description:
    Get estimated documents counts for collections matching the nsPattern.
  Parameters:
    nsPattern - regex/string to limit databases/collections returned
  Returns:
    { ok: ..., err: <error>, result: [ { ns: <db.coll>, count: <count> }, ... ] }`;

function getEstimatedDocumentCounts(nsPattern) {
  var ret = { ok: 1 }
  ret.result = [];
  try {
    getNameSpaces(nsPattern).result.forEach(function(namespace) {
      ret.result.push({ "ns": namespace, "count": getCollection(namespace).estimatedDocumentCount() });
    }); 
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

///////////////////////////////////////////////////////////////////////////////

usage.getAtlasSearchDocCount =
`getAtlasSearchDocCount(nsPattern)
  Description:
    Get estimated documents counts for Atlas Search as it has a limit of
    2B docs per replicaset / shard
  Parameters:
    nsPattern - regex/string to limit databases/collections returned
  Returns:
    { ok: ..., err: <error>, result: [ { ns: <db.coll>, count: <count> }, ... ] }`;

function getAtlasSearchDocCount(nsPattern) {
  var ret = { ok: 1 }
  ret.result = {};
  try {
    getNameSpaces(nsPattern).result.forEach(function(namespace) {
      var stats = getCollection(namespace).stats();
      ret.result[namespace] = [];
      if (isShardedCluster() == true ){
        Object.keys(stats.shards).forEach(function (sh) {
          ret.result[namespace].push({shard: sh, count: stats.shards[sh].count, percent: (stats.shards[sh].count/ maxAtlasSearchDocuments) * 100});
        });
      } else {
        ret.result[namespace].push({count: stats.count, percent: (stats.count/ maxAtlasSearchDocuments) * 100});
      }
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

///////////////////////////////////////////////////////////////////////////////

usage.getAvgObjSize =
`getAvgObjSize(nsPattern)
  Description:
    Get the average size of documents in collections matching the nsPattern.
  Parameters:
    nsPattern - regex/string to limit databases/collections returned
  Returns:
    { ok: ..., err: <error>, result: [ { ns: <db.coll>, avgObjSize: <bytes> }, ... ] }`;

function getAvgObjSize(nsPattern) {
  var ret = { ok: 1 }
  ret.result = [];
  try {
    getNameSpaces(nsPattern).result.forEach(function(namespace) {
      ret.result.push({ "ns": namespace, "avgObjSize": getCollection(namespace).stats().avgObjSize });
    }); 
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

///////////////////////////////////////////////////////////////////////////////

usage.getCurrentOps =
`getCurrentOps(nsPattern)
  Description:
    Get indexes based upon the nsPattern (regex).
    idxPattern allows you to scan the index for the name, parameters, etc.
  Parameters:
    nsPattern - regex/string to limit namespaces
    idxPattern - regex/string to limit indexes
  Returns:
    { ok: ..., err: <error>, result: [ { ns: <db>.<col>, indexes: [ <index>, ... ] } ] }`;

// Not too keen on how this one worked out. currentOp: true has to be the first element in associative array.

function getCurrentOps(pattern, options = { currentOp: true, "$all": true }) {
  var ret = { ok: 1 }
  ret.result = [];
  try {
    dbAdminCommand(options).inprog.forEach(function(op) {
      if (JSON.stringify(op).match(pattern)) {
        ret.result.push(op);
      }
    });  
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

const currentOps = {
  allOps: {
    currentOp: true,
    "$all": true
  },
  writeOpsWaitingForLock: {
    currentOp: true,
    "waitingForLock" : true,
    $or: [
      { "op" : { "$in" : [ "insert", "update", "remove" ] } },
      { "command.findandmodify": { $exists: true } }
    ]
  },
  activeOpsNoYields: {
    currentOp: true,
    "active" : true,
    "numYields" : 0,
    "waitingForLock" : false
  },
  activeOpsSpecificDatbase: {
    currentOp: true,
    "active" : true,
    "secs_running" : { "$gt" : 3 },
    "ns" : /^db1\./
  },
  activeIndexingOps: {
    currentOp: true,
    $or: [
      { op: "command", "command.createIndexes": { $exists: true }  },
      { op: "none", "msg" : /^Index Build/ }
    ]
  }
}

///////////////////////////////////////////////////////////////////////////////

usage.getCurrentOpsWaitingForLock =
`getCurrentOpsWaitingForLock(nsPattern)
  Description:
    Get indexes based upon the nsPattern (regex).
    idxPattern allows you to scan the index for the name, parameters, etc.
  Parameters:
    nsPattern - regex/string to limit namespaces
    idxPattern - regex/string to limit indexes
  Returns:
    { ok: ..., err: <error>, result: [ { ns: <db>.<col>, indexes: [ <index>, ... ] } ] }`;

//function getCurrentOpsWaitingForLock(pattern, options = { "waitingForLock": true, $or: [ { "op" : { "$in" : [ "insert", "update", "remove" ] } }, { "command.findandmodify": { $exists: true } } ] }) {
//  var ret = { ok: 1 }
//  ret.result = [];
//  options = { currentOp: true };
//  try {
//    getCurrentOps(pattern, options);
//    ret.result =  dbAdminCommand(options).inprog.forEach(function(op).result;
//  } catch (error) {
//    ret.ok = 0;
//    ret.err = error;
//  }
//  return ret;
//}


///////////////////////////////////////////////////////////////////////////////

usage.getDatabases =
`getDatabases(dbPattern)
  Description:
    Get databases based upon the dbPattern (regex).
  Parameters:
    dbPattern - regex/string to limit databases returned
  Returns:
    { ok: ..., err: <error>, result: [<db>, ...] }`;

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
    { ok: ..., err: <error>, result: [ { ns: <db>.<col>, indexes: [ <index>, ... ] } ] }`;

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

///////////////////////////////////////////////////////////////////////////////

usage.getIndexStats =
`getIndexStats(nsPattern, idxPattern)
  Description:
    Get the index stats based upon the nsPattern and idxPattern.
    idxPattern allows you to scan the index for the name, parameters, etc.
  Parameters:
    nsPattern - regex/string to limit namespaces
    idxPattern - regex/string to limit indexes
  Returns:
    { ok: ..., err: <error>, result: [ { ns: <db>.<col>, indexes: [ <index>, ... ] } ] }`;


function getIndexStats(nsPattern, idxPattern) {
  var ret = { ok: 1 }
  ret.result = [];
  try {
    getNameSpaces(nsPattern).result.forEach(function(ns) {
      var dbObj = { "ns": ns, "indexes": [] }
      var col = getCollection(ns);
      stats = col.stats();                                        // May want to write getStats()
      dbObj.totalIndexSize = stats.totalIndexSize;
      dbObj.avgIndexSize = stats.totalIndexSize / stats.count;
      dbObj.nIndexes = stats.nindexes;
      dbObj.docCount = stats.count;
      col.aggregate([{$indexStats:{}}]).forEach(function(idx) {
        if (JSON.stringify(idx).match(idxPattern)) {
          idx.size = stats.indexSizes[idx.name];
          idx.avgSize = stats.indexSizes[idx.name] / stats.count;
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

///////////////////////////////////////////////////////////////////////////////

usage.getUnusedIndexes =
`getUnusedIndexes(nsPattern)
  Description:
    Get the unused indexes based upon the nsPattern.
  Parameters:
    nsPattern - regex/string to limit namespaces
  Returns:
    { ok: ..., err: <error>, result: [ { ns: <db>.<col>, indexes: [ <index>, ... ] } ] }`;

function getUnusedIndexes(nsPattern) {
  var ret = { ok: 1 }
  ret.result = [];
  try {
    getNameSpaces(nsPattern).result.forEach(function(ns) {
      var dbObj = { "ns": ns, "indexes": [] }
      getCollection(ns).aggregate([{$indexStats:{}}]).forEach(function(idx) {
        if (JSON.stringify(idx).match(/"accesses":{"ops":{"low":0,"high":0,"unsigned":false}/)) {
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

///////////////////////////////////////////////////////////////////////////////

usage.getNameSpaces = 
`getNameSpaces(nsPattern)
  Description:
    Get namespaces based upon the nsPattern (regex).
  Parameters:
    nsPattern - regex/string to limit databases returned
  Returns:
    { ok: ..., err: <error>, result: [ <ns>, ... ] }`;

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

///////////////////////////////////////////////////////////////////////////////

usage.getProfilingStatuses =
`getProfilingStatuses(nsPattern)
  Description:
    Gets the profiling status for all namespaces based upon the nsPattern (regex).
  Parameters:
    nsPattern - regex/string to limit databases
  Returns:
    { ok: ..., err: <error>, result: [ { db: <db>, profilingStatus: <profilingStatus> } ] }`;

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

///////////////////////////////////////////////////////////////////////////////

usage.setProfilingLevels =
`setProfilingLevels(nsPattern, level, options)
  Description:
    Sets the profiling status for all namespaces based upon the nsPattern (regex).
  Parameters:
    nsPattern - regex/string to limit databases returned
    level - database profiler level
    options - integer - sets slowms
              document - passes options through to setProfilingLevel()
  Returns:
    { ok: ..., err: <error>, result: [ { db: <db>, profilingStatus: <profilingStatus> } ] }`;

function setProfilingLevels(nsPattern, level = 0, options = { slowms: 100 }) {
  var ret = { ok: 1, result: [] };
  try {
    getDatabases(nsPattern).result.forEach(function(database) {
      var dbObj = { "db": database } 
      dbObj.profilingStatus = getDatabase(database).setProfilingLevel(level, options);
      ret.result.push(dbObj);
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
    proj      - (optional) projection of the result
    sort      - (optional) sort the result for each query
  Returns:
    { ok: ..., err: <error>, result: [ { ns: <ns>, result: [<query-result>] ] }`;

function dbFind(nsPattern, query = {}, proj = {}, sort = {}) {
  var ret = { ok: 1, result: [] };
  try {
    getNameSpaces(nsPattern).result.forEach(function(ns) {
      ret.result.push({ "ns": ns, result: getCollection(ns).find(query, proj).sort(sort).toArray() });
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

///////////////////////////////////////////////////////////////////////////////

usage.splitNameSpace =
`splitNameSpace(namespace)
  Description:
    Given a namespace, it returns the database and collection names.
  Parameters:
    namespace - namespace
  Returns:
    { db: <databse>, col: <collection> }`;

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
    { ok: ..., err: <error>, result: [ { ns: <namespace>, commands: [ <create-index-command>, ...]  } ], string: <create-index-commands> }`;

function getCreateIndexCommands(nsPattern, idxPattern) {
  var ret = { ok: 1, result: [], string: '' };
  getIndexes(nsPattern, idxPattern).result.forEach(function(namespace) {
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
      ret.result.push(result);
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
    { ok: ..., err: <error>, result: [ { db: <db>, result: <enable/disable-result> } ] }`;

function setBalancing(nsPattern, enable) {
  var ret = { ok: 1, result: [] };
  try {
    getNameSpaces(nsPattern).result.forEach(function(ns) {
      stats = getCollection(ns).stats()
      if (stats.hasOwnProperty('shards') ) {
        if(enable === true) {
          ret.result.push(sh.enableBalancing(ns));
        } else {
          ret.result.push(sh.disableBalancing(ns));
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

usage.getLog =
`getLog(logPattern, options)
  Description:
    Gets the log from memory using getLog admin command.
  Parameters:
    logPattern - regex/string used to match the log entry
    options.type - type will be pass into getLog command; Default: 'global';
  Returns:
    { ok: ..., err: <error>, result: [ <log-entry>, ... ] }`;

function getLog (logPattern, options = { type: 'global', next: false } ) {
  var ret = { ok: 1, result: [] };
  try {
    var sessions = listSessionsBySessionId().result;
    var objLog;
    dynamic.getLog ||= {};
    var log = getDatabase('admin').adminCommand({ getLog: ( options.type || 'global' ) }).log;
    log.forEach( function( entry, idx ) {
      if(options.next == false || (entry > (dynamic.getLog.lastEntry ||= ''))) {
        if(entry.match(logPattern)) {
          objLog = JSON.parse(entry);
          if(objLog.attr && objLog.attr.command && objLog.attr.command.lsid && objLog.attr.command.lsid.id && objLog.attr.command.lsid.id['$uuid']) {
            if(sessions[objLog.attr.command.lsid.id['$uuid']]) {
              // If we can match the session ID to the user then add the user in
              objLog.attr.user = sessions[objLog.attr.command.lsid.id['$uuid']].user;
            }
          }
          ret.result.push(objLog);
          if(log.length - 1 == idx) {
            dynamic.getLog.lastEntry = entry;
          }
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

// ToDo:
// - add a save to file option

usage.nextLog =
`nextLog(logPattern, options)
  Description:
    Gets the next set of logs.
  Parameters:
    logPattern - regex/string used to match the log entry
    options.sRunTime - Seconds to run before exiting; omit to run continuously
    options.showRate - Show the rate of the log entries.
    options.file - file to write to
  Prints:
    <log-entry>
    ...`;

function nextLog(logPattern, options = {next: true}) {
  var ret = { ok: 1, result: [] };
  try {
    ret.result = getLog(logPattern, options).result;
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

///////////////////////////////////////////////////////////////////////////////

usage.watchLog =
`watchLog(logPattern, options)
  Description:
    Tails the internal log for sRunTime seconds looking for logPattern
  Parameters:
    logPattern - regex/string used to match the log entry
    options.sRunTime - Seconds to run before exiting; omit to run continuously
    options.showRate - Show the rate of the log entries.
    options.file - file to write to
  Prints:
    <log-entry>
    ...`;

function watchLog(logPattern, options = {}) {
  options.next = true;

  var rate = {
    startTime: ISODate(),
    duration: 0,
    count: 0
  };

  while(1) {
    log = getLog(logPattern, options).result;
    log.forEach(function(entry, idx) {
      print(entry);
      if(options.file != undefined) {
        fs.appendFile(options.file, JSON.stringify(entry) + "\n", err => {
          if (err) throw err;
        });
      }
    });

    if(options.showRate) {
      rate.duration = (ISODate().getTime() - rate.startTime)/1000; // seconds
      rate.count += log.length;
      print ("startTime: " + isoStartTime);
      print ("count: " + rate.count);
      print ("duration (s): " + rate.duration);
      print ("rate: " + (rate.count / rate.duration).toFixed(3) + "/s"); 
    }

    sleep(1023 - log.length);
  }
}

///////////////////////////////////////////////////////////////////////////////

usage.queryShape =
`queryShape(query)
  Description:
    Gets a generic query shape for a query.
  Parameters:
    query - query
  Returns (example):
    { a: 'number', b: 'number', c: { '$in': 'Array' } }`;

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

///////////////////////////////////////////////////////////////////////////////

usage.slowQueries =
`slowQueries(logPattern, options)
  Description:
    Displays a list of slow queries given a logPattern. 
  Parameters:
    logPattern - query
    options.sRunTime - length of time to run the operation
  Prints (example):
    tTotal | tAvg | tMax | tMin | Count |                  ns |   op | Plan     | Query Shape
    -------------------------------------------------------------------------------------------------------
        25 |   25 |   25 |   25 |     1 | sample_mflix.movies | find | COLLSCAN | {"directors":"string"}`;

function slowQueries(logPattern, options = {}) {
  var sRunTime = options.sRunTime;
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
    tTotal: 'tTotal'.length,
    tAvg: 'tAvg'.length,
    tMax: 'tMax'.length,
    tMin: 'tMin'.length,
    Count: 'Count'.length,
    ns: 'ns'.length,
    op: 'op'.length,
    Plan: 'Plan'.length,
    Shape: 'Shape'.length
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
    logs = getLog(logPattern).result.log;
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
              slowQuery.Count++;
              slowQuery.tMax = Math.max(slowQuery.maxTime, val.attr.durationMillis);
              slowQuery.tMin = Math.min(slowQuery.minTime, val.attr.durationMillis);
              slowQuery.tAvg = slowQuery.totalTime / slowQuery.count;
              slowQuery.tTotal += val.attr.durationMillis;
            } else {
              slowQuery = {};
              if(op == 'insert') {
                slowQuery.Shape = '';
              } else {
                slowQuery.Shape = strShape;
              }
              slowQuery.op = op;
              slowQuery.ns = ns;
              slowQuery.Count = 1;
              slowQuery.tMax = val.attr.durationMillis;
              slowQuery.tMin = val.attr.durationMillis;
              slowQuery.tTotal = val.attr.durationMillis;
              slowQuery.tAvg = slowQuery.tTotal / slowQuery.Count;
              idxSlowQueries[idx] = slowQueries.push(slowQuery) - 1;
              colWidth.Shape = Math.max(colWidth.Shape, slowQuery.Shape.length);
              colWidth.op = Math.max(colWidth.op, op.length);
              colWidth.ns = Math.max(colWidth.ns, ns.length);
            }
            slowQuery.Plan = plan;
            colWidth.tTime = Math.max(colWidth.tTotal, slowQuery.tTotal.toString().length);
            colWidth.tAvg = Math.max(colWidth.tAvg, slowQuery.tAvg.toString().length);
            colWidth.tMax = Math.max(colWidth.tMax, slowQuery.tMax.toString().length);
            colWidth.tMin = Math.max(colWidth.tMin, slowQuery.tMin.toString().length);
            colWidth.Count = Math.max(colWidth.Count, slowQuery.Count.toString().length);
            colWidth.Plan = Math.max(colWidth.Plan, slowQuery.Plan.length);
          }

        }
      } else {
        dups++;
      }
    });

    slowQueries.sort((a,b) => b.tTotal - a.tTotal);
    slowQueries.forEach((q,i) => {
      idxSlowQueries[q.op + ':' + q.Shape] = i;
    });

    var table = {};
    table.headings = [
      { name: 'tTotal', justify: 'R' },
      { name: 'tAvg', justify: 'R' },
      { name: 'tMax', justify: 'R' },
      { name: 'tMin', justify: 'R' },
      { name: 'Count', justify: 'R' },
      { name: 'ns', justify: 'R' },
      { name: 'op', justify: 'R' },
      { name: 'Plan', justify: 'R' },
      { name: 'Shape', justify: 'L' },
    ];
    table.data = slowQueries;

    printTable(table);
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
    var latestCounts = getEstimatedDocumentCounts(nsPattern).result;

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

usage.changeStream =
`changeStream(ns, pipeline, options, eventHandler)
  Description:
    Executes a change steam and, by default, prints out change events.
    Pipelines and options can be added along with passing in a function to handle the event.
  Parameters:
    ns - namespace
    pipeline - (optional) A pipeline which will be  passed into watch(); Default: []
    options - (optional) Options passed into watch(); Default: {}
    eventHandler - A function which will be pass the event; Default: function which prints the event`;

function changeStream(ns, pipeline = [], options = {}, eventHandler = function(event){print(JSON.stringify(event,null,2)); }) {
  var ret = { ok: 1, result: [] };
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
usage.findArchivedDocument =
`findArchivedDocument(nsArchive, query, options, eventHandler)
  Description:
    Executes a change steam and, by default, prints out change events.
    Pipelines and options can be added along with passing in a function to handle the event.
  Parameters:
    ns - namespace
    pipeline - (optional) A pipeline which will be  passed into watch(); Default: []
    options - (optional) Options passed into watch(); Default: {}
    eventHandler - A function which will be pass the event; Default: function which prints the event`;

csArchive = function(event){db.csArchive.insertOne(event)};

function findArchivedDocument(nsArchive, query, sortDocument = { clusterTime: 1} ) {
  var ret = { ok: 1 , result: null};
  try {
    var fullDocument = null;
    var archive = getCollection(nsArchive);
    var cursor = archive.find(query).sort(sortDocument);
    while(cursor.hasNext()) {
      event = cursor.next();
      if(['insert', 'replace'].includes(event.operationType)) {
        fullDocument = event.fullDocument;
      } else if (event.operationType == 'update') {
        fullDocument = mergeObjects(fullDocument, event.updateDescription.updatedFields);
        event.updateDescription.removedFields.forEach( function (path) {
          fullDocument = deleteKey(fullDocument, path);
        });
      } else if (event.operationType == 'delete') {
        fullDocument = null;
      }
    }
    ret.result = fullDocument;
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function mergeObjects (fullDoc, changeDoc) {
  Object.keys(changeDoc).forEach(key => {
    subDoc = fullDoc;
    keys = key.split('.');
    keys.forEach( k => {
      if(keys.indexOf(k) != keys.length - 1) {
        subDoc = subDoc[k] ||= {};
      } else {
        subDoc[k] = changeDoc[key];
      } 
    });
  });
  return fullDoc;
}

///////////////////////////////////////////////////////////////////////////////

usage.getWiredTigerCacheSize =
`getCacheStats(div)
  Description:
    Returns the WiredTiger Cache size.
  Parameters
    div - Divisor - pass 1024 for KB; 1024*1024 for MB; 1024*1024*1024 for GB;`;

function getWiredTigerCacheSize(div = 1) {
  var ret = { ok: 1 };
  try {
    ret.result = (static.wiredTigerCacheSize ||= db.serverStatus().wiredTiger.cache["maximum bytes configured"]) / div;
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

///////////////////////////////////////////////////////////////////////////////

usage.getWiredTigerCacheStats =
`getCacheStats(ns, options)
  Description:
    Returns what is currently in cache.
  Parameters:
    ns - namespace
    options.div - Divisor - pass 1024 for KB; 1024*1024 for MB; 1024*1024*1024 for GB;`;

function getWiredTigerCacheStats(ns, options = { div: 1, fixed: null }) {
  var ret = { ok: 1, result: {} };

  try {
    ret.result.totalSize = getWiredTigerCacheSize(options.div).result;
    ret.result.allocated = 0;
    ret.result.free = ret.result.totalSize;
    ret.result.allocatedPercent = 0;
    ret.result.freePercent = 0;
    ret.result.inCache = [];
    getNameSpaces(ns).result.forEach(function (ns) {
      var current = {};
      var colStats = getCollection(ns).stats({ indexDetails: true });
      current.ns = ns;
      current.docs = colStats.wiredTiger.cache["bytes currently in the cache"] / options.div;
      current.indexes = colStats.indexDetails._id_.cache["bytes currently in the cache"] / options.div;
      current.docsPercent = current.docs / ret.result.totalSize * 100;
      current.indexesPercent = current.indexes / ret.result.totalSize * 100;
      ret.result.allocated += current.docs + current.indexes;
      ret.result.free -= current.docs + current.indexes;
      ret.result.inCache.push(current);
    });
    ret.result.allocatedPercent = ret.result.allocated / ret.result.totalSize * 100;
    ret.result.freePercent = ret.result.free / ret.result.totalSize * 100;
    if(options.fixed != null) {
      ret.result.totalSize = ret.result.totalSize.toFixed(options.fixed);
      ret.result.allocated = ret.result.allocated.toFixed(options.fixed);
      ret.result.allocatedPercent = ret.result.allocatedPercent.toFixed(options.fixed);
      ret.result.free = ret.result.free.toFixed(options.fixed);
      ret.result.freePercent = ret.result.freePercent.toFixed(options.fixed);
      ret.result.inCache.forEach( item => {
        item.docs = item.docs.toFixed(options.fixed);
        item.indexes = item.indexes.toFixed(options.fixed);
        item.docsPercent = item.docsPercent.toFixed(options.fixed);
        item.indexesPercent = item.indexesPercent.toFixed(options.fixed);
      });
    }
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

///////////////////////////////////////////////////////////////////////////////

usage.watchWiredTigerCacheStats =
`watchWiredTigerCacheStats(ns, options)
  Description:
    Displays what is currently in cache.
  Parameters:
    ns - namespace
    options.div - Divisor - pass 1024 for KB; 1024*1024 for MB; 1024*1024*1024 for GB;`;

function watchWiredTigerCacheStats(ns, options = { div: 1, fixed: null }) {
  var ret = { ok: 1, result: {} };

  var sRunTime = options.sRunTime;
  var msRunTime = sRunTime * 1000;
  var unit = 'unknown';

  switch (options.div) {
    case 1:
      unit = 'B';
      break; 
    case 1024:
      unit = 'KB';
      break; 
    case 1024*1024:
      unit = 'MB';
      break; 
    case 1024*1024*1024:
      unit = 'GB';
      break; 
    case 1024*1024*1024*1024:
      unit = 'TB';
      break; 
    case 1024*1024*1024*1024*1024:
      unit = 'PB';
      break; 
  }

  var table = {
    headings: [
      { name: 'ns', justify: 'R' },
      { name: 'docs', justify: 'R', unit: unit },
      { name: 'docsPercent', justify: 'R', unit: '%' },
      { name: 'indexes', justify: 'R', unit: unit },
      { name: 'indexesPercent', justify: 'R', unit: '%' }
    ]
  };

  try {
    while(sRunTime === undefined || sRunTime === null || msRunTime > 0) {
      wtcStats = getWiredTigerCacheStats(ns,options);
      table.data = wtcStats.result.inCache;
      print("\n");
      print("WIRED TIGER CACHE CONTENTS");
      print("Total Size: " + wtcStats.result.totalSize);
      print("Allocated: " + wtcStats.result.allocated);
      print("Free: " + wtcStats.result.free);
      printTable(table);
      print("\n");
      sleep(1);
    }
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret;
}

function printTable(table) {
  var cw = {};
  var headings = [];
  var justify = {};
  var unit = {};
  table.headings.forEach( h => {
    headings.push(h.name);
    justify[h.name] = h.justify;
    //unit[h.name] = ('unit' in h ? h.unit : null);
    unit[h.name] = h.unit || null;
  });

  var data = table.data;
  // Use the headings to set the size of the columns
  headings.forEach( h => {
    if(unit[h] != null) {
      cw[h] = h.length + unit[h].length + 1;
    } else {
      cw[h] = h.length;
    }
  });
  data.forEach( d => {
    headings.forEach( h => {
      cw[h] = Math.max(cw[h], d[h].toString().length);
    });
  });

  // print headings
  var line = '';
  var heading = '';
  headings.forEach( h => {
    if(unit[h] != null) {
      heading = h + ' ' + unit[h];
    } else {
      heading = h;
    }
    if(justify[h] == 'R'){
      line += heading.padStart(cw[h]);
    } else if (justify[h] == 'L') {
      line += heading.padEnd(cw[h])
    } else if (justify[h] == 'C') {
      line += heading.substr(0, Math.ceil(h.length / 2)).padStart(Math.ceil(cw[h]/2)) + heading.substr(Math.ceil(h.length/2)).padEnd(Math.floor(cw[h]/2))
    } else {
      line += cw[h];
    }
    line += (h != headings[headings.length - 1]) ? ' | ' : '';
  });
  print(line);

  print("-".padStart(Object.values(cw).reduce((pSum, a) => pSum+a, 0) + ((Object.keys(cw).length - 1) * 3),'-'));

  // print data
  data.forEach(d => {
    line = '';
    headings.forEach( h => {
      if(justify[h] == 'R'){
        line += d[h].toString().padStart(cw[h])
      } else if (justify[h] == 'L') {
        line += d[h].toString().padEnd(cw[h])
      } else if (justify[h] == 'C') {
        line += d[h].substr(0, Math.ceil(d[h].length / 2)).padStart(Math.ceil(cw[h]/2)) + d[h].substr(Math.ceil(d[h].length/2)).padEnd(Math.floor(cw[h]/2))
      } else {
        line += cw[h];
      }
      line += (h != headings[headings.length - 1]) ? ' | ' : '';
    });
    print(line);
  });
}

// Report test table
testTable = {
  headings: [{name: "CENTERED", justify: 'C'},{name: 'Collection', justify: 'L'}, { name: 'Average', justify: 'R'}, { name: 'Total', justify: 'R'} ],
  data: [
    { CENTERED: "zzzzzzzzzzzzzzz", Collection: 'bishop.brad', Average: 4.5, Total: 10 }
  ]
}

///////////////////////////////////////////////////////////////////////////////

usage.getSizingInfo =
`getSizingInfo(pattern)
  Description:
    Prints the sizing info for the cluster based upon the pattern
  Parameters:
    pattern - pattern that namespace much match`;

function getSizingInfo(pattern) {
  var ret = { ok: 1, result: {}, string: "" };
  var ns;
  try {
    getCollections(pattern).result.forEach(function(dbObj) {
      if(!(dbObj.db in ret.result)) {
        ret.result[dbObj.db] = {}; 
      }
      dbObj.cols.forEach(function(col) {
      ns = dbObj.db + '.' + col;
        var stats = getCollection(ns).stats();
        var blockManager = stats.wiredTiger['block-manager'];
        ret.result[dbObj.db][col] = {
          avgIndexSize: stats.totalIndexSize/stats.count,
          avgObjSize: stats.avgObjSize,
          count: stats.count,
          fragmentation: (blockManager['file bytes available for reuse']/stats.storageSize) * 100,
          nIndexes: stats.nindexes,
          size: stats.size,
          storageSize: stats.storageSize,
          totalIndexSize: stats.totalIndexSize,
          wtCompressionRatio: (stats.storageSize - blockManager['file bytes available for reuse'])/stats.size,
        };
        ret.string += dbObj.db + "," + col + "," + stats.count + "," + stats.size + "," + stats.avgObjSize + "," + stats.totalIndexSize + "," + stats.totalIndexSize/stats.count + "," + (stats.storageSize - blockManager['file bytes available for reuse'])/stats.size + "," + stats.nindexes + "\n";
      });
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

///////////////////////////////////////////////////////////////////////////////

usage.getStartupWarnings =
`getStartupWarnings()
  Description:
    Returns startup warnings.`
 
function getStartupWarnings () {
  var ret = { ok: 1 };
  try {
    ret.result = getDatabase('admin').adminCommand({ getLog: 'startupWarnings' });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

///////////////////////////////////////////////////////////////////////////////

usage.getBuildInfo =
`getBuildInfo()
  Description:
    Returns startup warnings.`

function getBuildInfo() {
  var ret = { ok: 1 };
  try {
    ret.result = getDatabase('admin').runCommand({ buildInfo: 1});
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

///////////////////////////////////////////////////////////////////////////////

usage.getConnections =
`getConnections()
  Description:
    Returns current connections from current operations.`

function getConnections() {
  var ret = { ok: 1 };
  try {
    ret.result = db.currentOp(true).inprog.reduce(
      (accumulator, connection) => {
        let ipaddress = connection.client ? connection.client.split(":")[0] : "Internal";
        if (accumulator[ipaddress]) {
          accumulator[ipaddress] += 1;
        } else {
          accumulator[ipaddress] = 1;
        }
        return accumulator;
      },
      {}
    );
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

///////////////////////////////////////////////////////////////////////////////

usage.getShardedClusterHosts =
`getShardClusterHosts()
  Description:
    Gets list of hosts for the replica set.`

function getShardedClusterHosts() {
  var ret = { ok: 1, result: {} };
  try {
    ret.result = [];
    var hosts = '';
    getDatabase('config').shards.find().toArray().forEach( shard => {
      hosts = shard.host;
      hosts = hosts.slice(hosts.search('/')+1)
      ret.result[shard._id] = hosts.split(',');

    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}
 
///////////////////////////////////////////////////////////////////////////////

usage.getReplicaSetHosts =
`getReplicaSetHosts()
  Description:
    Gets list of hosts for the replica set.`

function getReplicaSetHosts() {
  var ret = { ok: 1 };
  try {
    ret.result = [];
    rs.config().members.forEach( member => { ret.result.push(member.host) });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}
 
///////////////////////////////////////////////////////////////////////////////

usage.buildConnectionString =
`buildConnectionString(hostname)
  Description:
    Connects to each host; Run login() first.
  Parameters:
    hostname - hostname
    port - port
  Returns:
    mongodb connection string.`

function buildConnectionString(hostname) {
  var ret = { ok: 1 };
  try {
    static.user ||= db.runCommand({connectionStatus: 1}).authInfo.authenticatedUsers[0].user;
    ret.result = `mongodb://${static.user}:${static.password}@${hostname}/?tls=true`;
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}
 
///////////////////////////////////////////////////////////////////////////////

usage.connectHosts =
`connectHosts()
  Description:
    Connects to each host; Run login() first.`

function connectHosts() {
  var ret = { ok: 1, result: [] };
  try {
    if(static.password == undefined) {
      login();
    }

    if(static.nodes == undefined) {
      if(isShardedCluster() == true) {
        var shHosts = getShardedClusterHosts().result;
        Object.keys(shHosts).forEach( shard => {
          shHosts[shard].forEach(host => {
            static["nodes"] ||= {};
            static["nodes"][host] = connect(buildConnectionString(host).result);
          });
        });
      } else if (isReplicaSet() == true) {
        var rsStatus = {};
        rs.status().members.forEach( member => {
          rsStatus[member.name] = {
            "id": member._id,
            "stateStr": member.stateStr
          }
        });
        getReplicaSetHosts().result.forEach( host => { 
          static["nodes"] ||= {};
          static["nodes"][host] = connect(buildConnectionString(host).result);
        });
      }
      ret.result = static["nodes"];
    }
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

///////////////////////////////////////////////////////////////////////////////

usage.reConnectHosts =
`reConnectHosts()
  Description:
    re-connects to each host`

function reConnectHosts() {
  var ret = { ok: 1, result: [] };
  try {
    delete static['nodes'];
    ret = connectHosts();
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
  
}

///////////////////////////////////////////////////////////////////////////////

usage.connectShards =
`connectShards()
  Description:
    Connects to each shard; Run login() first.`

function connectShards() {
  var ret = { ok: 1, result: [] };
  try {
    if(isShardedCluster() == true) {
      var shHosts = getShardedClusterHosts().result;
      var hosts = '';
      static["shards"] ||= {};
      Object.keys(shHosts).forEach( shard => {
        hosts = shHosts[shard].join(',');
        strConn = buildConnectionString(hosts).result;
        static["shards"][shard] = connect(buildConnectionString(hosts).result);
      });
    }
    ret.result = static["shards"];
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

///////////////////////////////////////////////////////////////////////////////

usage.useStart =
`useStart()
  Description:
    Switches to the original connection.`

function useStart() {
  var ret = { ok: 1, result: {} };
  try {
    ret.result['db'] = db = dbStart;
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

///////////////////////////////////////////////////////////////////////////////

usage.usePrimary =
`usePrimary()
  Description:
    Switches connection to the primary node.`

function usePrimary() {
  var ret = { ok: 1, result: {} };
  try {
    if(static.nodes == undefined) {
      connectHosts();
    }
    rs.status().members.forEach( member => {
      if(member.stateStr == 'PRIMARY') {
        ret.result['host'] = member.name;
        ret.result['db'] = db = static.nodes[member.name];
      }
    });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

///////////////////////////////////////////////////////////////////////////////

usage.nextSecondary =
`nextSecondary()
  Description:
    Switches connection to the next secondary node.`

function nextSecondary() {
  var ret = { ok: 1, result: {} };
  try {

    if(static.nodes == undefined) {
      connectHosts();
    }

    var members = rs.status().members;
    var firstSecondary;
    var currSecondary;
    var nextSecondary;
    members.forEach( member => {
      if(member.stateStr == 'SECONDARY') {
        if(firstSecondary == undefined) {
          firstSecondary = member.name;
        }

        if(db == static.nodes[member.name]){
          currSecondary = member.name;;
          return;
        } 

        if(currSecondary != undefined) {
          nextSecondary = member.name;
        }
      }
    });
    ret.result['host'] = nextSecondary ||= firstSecondary;
    ret.result['db'] = db = static.nodes[nextSecondary];
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

 
 
 
///////////////////////////////////////////////////////////////////////////////

// Keyhole

// FIXIT
function getCollStats(nsPattern) {
  var ret = { ok: 1 };
  try {
//    ret.result = getDatabase('admin').runCommand({ buildInfo: 1});
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

// FIXIT: Catch sharded cluster!
function getConnPoolStats() {
  var ret = { ok: 1, result: [] };
  try {
    ret.result = getDatabase('admin').adminCommand({ getCmdLineOpts: 1 }); // BSB FIX THIS!
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

function getHostInfo () {
  var ret = { ok: 1 };
  try {
    ret.result = getDatabase('admin').adminCommand({ hostInfo: 1});
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 
}

function getCmdLineOpts () {
  var ret = { ok: 1 };
  try {
    ret.result = getDatabase('admin').adminCommand({ getCmdLineOpts: 1 });
  } catch (error) {
    ret.ok = 0;
    ret.err = error;
  }
  return ret; 

}

function isStandAlone() {
  return (isReplicaSet() || isShardedCluster()) ? false : true;
}

function isReplicaSet() {
  return getCmdLineOpts().result.parsed['replication'] != undefined;
}

function isShardedCluster() {
  return getCmdLineOpts().result.parsed['sharding'] != undefined;
}

function getBuildInfo() {
  var ret = { ok: 1 };
  try {
    ret.result = getDatabase('admin').runCommand({ buildInfo: 1 });
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

function deleteKey(obj, path) {
    const _obj = JSON.parse(JSON.stringify(obj));
    const keys = path.split('.');

    keys.reduce((acc, key, index) => {
        if (index === keys.length - 1) {
            delete acc[key];
            return true;
        }
        return acc[key];
    }, _obj);

    return _obj;
}

function getStableAPIStatus() {
  var ret = { ok: 1, result: {} }
  
  var apiStatus = db.serverStatus().metrics.apiVersions;
 
  Object.keys(apiStatus).forEach(function (app) {
    apiStatus[app].forEach(function (ver) {
      if (! (ver in ret.result)){
        ret.result[ver] = [];
      }
      ret.result[ver].push(app);
    });
  });
  return ret;
}

function getUserConfirmation(action, targetType, targetList) {
  var userInput = 'NO';

  print( `The following matching ${targetType} were found: ` );
  print('');

  switch (targetType) {
    case 'databases':
      targetList.forEach(function (dbObj) {
        print(`   ${dbObj}`);
      });

      break;

    case 'collections':
      targetList.forEach(function (dbObj) {
        var db = dbObj.db;
        var cols = dbObj.cols;

        cols.forEach(function (col) {
          print(`   ${db}.${col}`);
        });

      });

      break;

    case 'indexes':
      targetList.forEach(function(dbObj) {
        var ns = dbObj.ns;
        var idxs = dbObj.indexes;

        idxs.forEach(function (idx) {
          if (idx.name !== '_id_') {
            print(`   ${ns}.${idx.name}`);
          }
        });
      });

      break;

    default:
      return false;
  }

  var auth;
  var admin = getDatabase("admin");
  var user = db.runCommand({connectionStatus: 1}).authInfo.authenticatedUsers[0].user;

  print('');
  print(`Please provide ${user}'s password to confirm this action`);

  try {
    auth = admin.auth(user).ok;
  } catch (e) {
    auth = 0;
  }

  print('');

  return auth === 1;

}

function silent() { return true; }

