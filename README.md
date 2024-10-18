# .mongoshrc.js

This plugin provides utility functions for the MongoDB `mongosh` shell, extending its capabilities with additional commands for database administration, log monitoring, and more.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Getting Help](#getting-help)
  - [Functions](#functions)
    - [Utilities](#utilities)
    - [Session Management](#session-management)
    - [Database and Collection Operations](#database-and-collection-operations)
    - [Index Management](#index-management)
    - [Profiling and Monitoring](#profiling-and-monitoring)
    - [Logging and Query Analysis](#logging-and-query-analysis)
    - [Other Functions](#other-functions)
- [Contributing](#contributing)
- [License](#license)

## Features

- Extend the MongoDB shell with additional administrative commands.
- Perform batch operations on databases, collections, and indexes.
- Monitor and analyze logs to identify slow queries.
- Manage sessions and monitor profiling settings.
- Custom utilities for common database tasks.

## Installation

1. Save the script as `.mongoshrc.js` in your preferred location.
2. Launch mongosh
```
mongosh -u <user> "mongodb+srv://server.example.com/"
```
3. Load the script in the MongoDB shell:
```javascript
load('/path/to/.mongoshrc.js')
```
4. The library functions will be available in the MongoDB shell.

## Usage

### Getting Help

To see the list of available commands, use:
```javascript
getHelp()
```
To filter the help output by a specific pattern, provide a regex:
```javascript
getHelp(/pattern/)
```

### Functions

#### Utilities

- **`getHelp(pattern)`**  
  Returns a list of functions matching the specified pattern.
  - **Parameters:**
    - `pattern` (String): A regex pattern to filter function names.
  - **Returns:** Prints the usage information for matching functions.

- **`splitNameSpace(namespace)`**  
  Splits a namespace into database and collection names.
  - **Parameters:**
    - `namespace` (String): The namespace to split (`<db>.<col>`).
  - **Returns:** An object with the database and collection names.

#### Session Management

- **`listSessions(pattern, options)`**  
  Lists all active sessions, excluding system sessions.
  - **Parameters:**
    - `pattern` (Regex): A pattern to search for in session information.
    - `options` (Object): Options for the `$listSessions` command. Default is `{ allUsers: true }`.
  - **Returns:** A list of matching sessions.

- **`listSessionsBySessionId(pattern, options)`**  
  Lists sessions indexed by session ID.
  - **Parameters:**
    - `pattern` (Regex): A pattern to search for in session information.
    - `options` (Object): Options for the `$listSessions` command. Default is `{ allUsers: true }`.
  - **Returns:** Sessions indexed by session ID.

- **`listSessionsByUserId(pattern, options)`**  
  Lists sessions indexed by user ID.
  - **Parameters:**
    - `pattern` (Regex): A pattern to search for in session information.
    - `options` (Object): Options for the `$listSessions` command. Default is `{ allUsers: true }`.
  - **Returns:** Sessions indexed by user ID.

#### Database and Collection Operations

- **`getCollection(namespace)`**  
  Gets a collection object based on the provided namespace.
  - **Parameters:**
    - `namespace` (String): The namespace of the collection (`<db>.<col>`).
  - **Returns:** The collection object.

- **`getDatabase(database)`**  
  Gets a database object based on the provided name.
  - **Parameters:**
    - `database` (String): The name of the database.
  - **Returns:** The database object.

- **`dropCollections(nsPattern)`**  
  Drops collections that match a given namespace pattern.
  - **Parameters:**
    - `nsPattern` (Regex): A pattern to match collection namespaces.
  - **Returns:** Results of the drop operation.

- **`dropDatabases(pattern)`**  
  Drops databases that match the given pattern.
  - **Parameters:**
    - `pattern` (Regex): A pattern to match database names.
  - **Returns:** Results of the drop operation.

- **`getCollections(nsPattern)`**  
  Retrieves collections matching the specified namespace pattern.
  - **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
  - **Returns:** A list of collections.

- **`getEstimatedDocumentCounts(nsPattern)`**  
  Retrieves estimated document counts for collections matching the pattern.
  - **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
  - **Returns:** Document count estimates.

#### Index Management

- **`dropIndexes(nsPattern, idxPattern)`**  
  Drops indexes across namespaces and patterns.
  - **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
    - `idxPattern` (Regex): Pattern to match index names.
  - **Returns:** Results of the index drop operation.

- **`getIndexes(nsPattern, idxPattern)`**  
  Retrieves indexes for namespaces and index patterns.
  - **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
    - `idxPattern` (Regex): Pattern to match index names.
  - **Returns:** Index information.

- **`getIndexStats(nsPattern, idxPattern)`**  
  Retrieves statistics for indexes matching the patterns.
  - **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
    - `idxPattern` (Regex): Pattern to match index names.
  - **Returns:** Index statistics.

- **`getUnusedIndexes(nsPattern)`**  
  Retrieves unused indexes based on the specified pattern.
  - **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
  - **Returns:** Information on unused indexes.

- **`getCreateIndexCommands(nsPattern, idxPattern)`**  
  Generates commands to create indexes for the specified patterns.
  - **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
    - `idxPattern` (Regex): Pattern to match index names.
  - **Returns:** Index creation commands.

#### Profiling and Monitoring

- **`getProfilingStatuses(nsPattern)`**  
  Retrieves profiling statuses for matching namespaces.
  - **Parameters:**
    - `nsPattern` (Regex): Pattern to match database names.
  - **Returns:** Profiling status information.

- **`setProfilingLevels(nsPattern, level, options)`**  
  Sets profiling levels for matching namespaces.
  - **Parameters:**
    - `nsPattern` (Regex): Pattern to match database names.
    - `level` (Integer): Profiling level.
    - `options` (Object): Additional options such as `slowms`.
  - **Returns:** Results of setting profiling levels.

#### Logging and Query Analysis

- **`getLog(logPattern, options)`**  
  Retrieves logs matching a specified pattern.
  - **Parameters:**
    - `logPattern` (Regex): Pattern to match log entries.
    - `options` (Object): Options for log retrieval. Default is `{ type: 'global' }`.
  - **Returns:** Matching log entries.

- **`tailLog(logPattern, options)`**  
  Monitors logs for matching entries.
  - **Parameters:**
    - `logPattern` (Regex): Pattern to match log entries.
    - `options` (Object): Options such as run time and entry rate.
  - **Returns:** Monitored log entries.

- **`slowQueries(logPattern, options)`**  
  Identifies slow queries in the logs based on a pattern.
  - **Parameters:**
    - `logPattern` (Regex): Pattern to match log entries.
    - `options` (Object): Options such as run time.
  - **Returns:** Slow query information.

- **`queryShape(query)`**  
  Generates a shape representation for a query.
  - **Parameters:**
    - `query` (Object): The query to analyze.
  - **Returns:** Query shape.

#### Other Functions

- **`watchEstimatedDocumentCounts(nsPattern, sRunTime, msPollTime)`**  
  Monitors changes in document counts for collections.
  - **Parameters:**
    - `nsPattern` (Regex): Pattern to match namespaces.
    - `sRunTime` (Integer): Duration to monitor.
    - `msPollTime` (Integer): Polling interval in milliseconds.
  - **Returns:** Changes in document counts.

- **`changeStream(ns, pipeline, options, eventHandler)`**  
  Executes a change stream and processes events.
  - **Parameters:**
    - `ns` (String): The namespace to monitor.
    - `pipeline` (Array): Filter pipeline for events.
      options (Object): Options for the change stream.
      eventHandler (Function): Function to handle events.
      Returns: Change stream results.
      Contributing
      Contributions are welcome! Please submit a pull request or open an issue if you encounter bugs or have suggestions.

## License
This project is licensed under the MIT License.
