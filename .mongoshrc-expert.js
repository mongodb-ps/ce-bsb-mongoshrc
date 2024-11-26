
///////////////////////////////////////////////////////////////////////////////
// Drop commands
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
  NOTICE: This operation will prompt for user confirmation, enter password to confirm
          OR pass 'silent' option as the last parameter to bypass confirmation i.e:
          dropCollections(nsPattern, silent)`;
function dropCollections(nsPattern, Confirmation = getUserConfirmation) {
  var ret = { ok: 1, results: [] };
  var cya = Confirmation;
  try {
    // Use getCollections() to confirm which collections will be dropped based upon the nsPattern
    const results = getCollections(nsPattern).results;
    if(!cya("drop", "collections", results))
      throw `User must confirm this action ... dropCollections aborted!`;
    results.forEach(function(dbObjIn) {
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
  NOTICE: This operation will prompt for user confirmation, enter password to confirm
          OR pass 'silent' option as the last parameter to bypass confirmation i.e:
          dropDatabases(pattern, silent)`;
function dropDatabases(pattern, Confirmation = getUserConfirmation) {
  var ret = { ok: 1, results: [] };
  var cya = Confirmation;
  try {
    // Use getDatabases() to confirm which databases will be dropped based upon the nsPattern
    const results = getDatabases(pattern).results;
    if(!cya("drop", "databases", results))
      throw `User must confirm this action ... dropDatabases aborted!`;
    results.forEach(function(database) {
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
  NOTICE: This operation will prompt for user confirmation, enter password to confirm
          OR pass 'silent' option as the last parameter to bypass confirmation i.e:
          dropIndexes(nsPattern, idxPattern, silent)`;
function dropIndexes(nsPattern, idxPattern, Confirmation = getUserConfirmation) {
  var ret = { ok: 1, results: [] };
  var cya = Confirmation;
  try {
    const results = getIndexes(nsPattern, idxPattern).results;
    if(!cya("drop", "indexes", results))
      throw `User must confirm this action ... dropIndexes aborted!`;
    results.forEach(function(nsObj) {
      var dbObj = { "ns": nsObj.ns, results: [] };
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

