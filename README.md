# mongoshrc

### `getHelp(pattern)`
- **Description:** Returns a list of all functions matching the specified pattern.
- **Parameters:**
    - `pattern` (String): The pattern to match function names.
- **Returns:** Prints usage for functions matching the given pattern.

### `dbRunCommand(document)`
- **Description:** Executes a database command using `db.runCommand`.
- **Parameters:**
    - `document` (Object): The command document.
- **Returns:** Results of the command run.

### `dbAdminCommand(document)`
- **Description:** Executes a database admin command using `db.adminCommand`.
- **Parameters:**
    - `document` (Object): The command document.
- **Returns:** Results of the admin command.

### `listSessions(pattern, options)`
- **Description:** Returns a list of sessions excluding certain system sessions.
- **Parameters:**
    - `pattern` (Regex): Pattern to search for in session information.
    - `options` (Object): Optional settings for the `$listSessions` command. Default is `{ allUsers: true }`.
- **Returns:** An object containing session details and errors, if any.

### `listSessionsBySessionId(pattern, options)`
- **Description:** Returns sessions indexed by their session ID.
- **Parameters:**
    - `pattern` (Regex): Pattern to search for in session information.
    - `options` (Object): Optional settings for the `$listSessions` command. Default is `{ allUsers: true }`.
- **Returns:** An object containing session details indexed by session ID.

### `listSessionsByUserId(pattern, options)`
- **Description:** Returns sessions indexed by user ID.
- **Parameters:**
    - `pattern` (Regex): Pattern to search for in session information.
    - `options` (Object): Optional settings for the `$listSessions` command. Default is `{ allUsers: true }`.
- **Returns:** An object containing session details indexed by user ID.

### `getCollection(namespace)`
- **Description:** Retrieves a collection object based on the provided namespace.
- **Parameters:**
    - `namespace` (String): The database and collection name in the format `<db>.<col>`.
- **Returns:** The collection object.

### `getDatabase(database)`
- **Description:** Retrieves a database object based on the provided name.
- **Parameters:**
    - `database` (String): The database name.
- **Returns:** The database object.

### `dropCollections(nsPattern, Confirmation)`
- **Description:** Drops collections that match a given namespace pattern.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match collection namespaces.
    - `Confirmation` (Function): A function for user confirmation.
- **Returns:** An object with results of the drop operation.

### `dropDatabases(pattern, Confirmation)`
- **Description:** Drops databases that match a given pattern.
- **Parameters:**
    - `pattern` (Regex): Pattern to match database names.
    - `Confirmation` (Function): A function for user confirmation.
- **Returns:** An object with results of the drop operation.

### `dropIndexes(nsPattern, idxPattern, Confirmation)`
- **Description:** Drops indexes across matching namespaces and index patterns.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
    - `idxPattern` (Regex): Pattern to match index names.
    - `Confirmation` (Function): A function for user confirmation.
- **Returns:** An object with results of the index drop operation.

### `getCollections(nsPattern)`
- **Description:** Gets collections based on a namespace pattern.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match collection namespaces.
- **Returns:** An object with the list of matching collections.

### `getEstimatedDocumentCounts(nsPattern)`
- **Description:** Retrieves estimated document counts for matching collections.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match collection namespaces.
- **Returns:** An object with estimated document counts.

### `getAvgObjSize(nsPattern)`
- **Description:** Retrieves the average size of documents in matching collections.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match collection namespaces.
- **Returns:** An object with average document sizes.

### `getDatabases(dbPattern)`
- **Description:** Gets databases based on a pattern.
- **Parameters:**
    - `dbPattern` (Regex): Pattern to match database names.
- **Returns:** An object with the list of matching databases.

### `getIndexes(nsPattern, idxPattern)`
- **Description:** Retrieves indexes for matching namespaces and index patterns.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
    - `idxPattern` (Regex): Pattern to match index details.
- **Returns:** An object with index information.

### `getIndexStats(nsPattern, idxPattern)`
- **Description:** Retrieves index statistics for matching namespaces and index patterns.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
    - `idxPattern` (Regex): Pattern to match index details.
- **Returns:** An object with index statistics.

### `getUnusedIndexes(nsPattern)`
- **Description:** Retrieves unused indexes based on a namespace pattern.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
- **Returns:** An object with unused index information.

### `getNameSpaces(nsPattern)`
- **Description:** Retrieves namespaces based on a pattern.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespace names.
- **Returns:** An object with the list of matching namespaces.

### `getProfilingStatuses(nsPattern)`
- **Description:** Retrieves profiling statuses for all matching namespaces.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match database names.
- **Returns:** An object with profiling status information.

### `setProfilingLevels(nsPattern, level, options)`
- **Description:** Sets the profiling levels for matching namespaces.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match database names.
    - `level` (Integer): Profiling level.
    - `options` (Object): Options such as `slowms`.
- **Returns:** An object with profiling status results.

### `dbFind(nsPattern, query, proj, sort)`
- **Description:** Executes a query across matching namespaces.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
    - `query` (Object): The query to execute.
    - `proj` (Object): Fields to include or exclude.
    - `sort` (Object): Sort order for the results.
- **Returns:** An object with query results.

### `splitNameSpace(namespace)`
- **Description:** Splits a namespace into database and collection names.
- **Parameters:**
    - `namespace` (String): The namespace in the format `<db>.<col>`.
- **Returns:** An object containing the database and collection names.

### `getCreateIndexCommands(nsPattern, idxPattern)`
- **Description:** Retrieves index creation commands for matching namespaces and index patterns.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
    - `idxPattern` (Regex): Pattern to match index details.
- **Returns:** An object containing the index creation commands.

### `setBalancing(nsPattern, enable)`
- **Description:** Enables or disables balancing for matching namespaces.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
    - `enable` (Boolean): `true` to enable, `false` to disable.
- **Returns:** An object with balancing status results.

### `getLog(logPattern, options)`
- **Description:** Retrieves logs from the database based on a pattern.
- **Parameters:**
    - `logPattern` (Regex): Pattern to match log entries.
    - `options` (Object): Log retrieval options, e.g., `type`.
- **Returns:** An object containing matching log entries.

### `tailLog(logPattern, options)`
- **Description:** Continuously monitors logs for entries matching a pattern.
- **Parameters:**
    - `logPattern` (Regex): Pattern to match log entries.
    - `options` (Object): Options such as run time and log entry rate.
- **Prints:** Matched log entries.

### `queryShape(query)`
- **Description:** Generates a generic shape for a query.
- **Parameters:**
    - `query` (Object): The query to analyze.
- **Returns:** An object representing the shape of the query.

### `slowQueries(logPattern, options)`
- **Description:** Displays a list of slow queries based on log patterns.
- **Parameters:**
    - `logPattern` (Regex): Pattern to match log entries.
    - `options` (Object): Options such as run time.
- **Prints:** Information about slow queries.

### `watchEstimatedDocumentCounts(nsPattern, sRunTime, msPollTime)`
- **Description:** Monitors changes in document counts for matching collections.
- **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
    - `sRunTime` (Integer): Duration in seconds to monitor.
    - `msPollTime` (Integer): Polling interval in milliseconds.
- **Prints:** Changes in document counts.

### `changeStream(ns, pipeline, options, eventHandler)`
- **Description:** Executes a change stream and handles events.
- **Parameters:**
    - `ns` (String): The namespace to monitor.
    - `pipeline` (Array): Pipeline for filtering events.
    - `options` (Object): Options for the watch command.
    - `eventHandler` (Function): Function to handle change events.
- **Returns:** An object with the results of the change stream.
