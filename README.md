# status development
```
under work in progress
```
this message development will be removed soon after full realase beta
# nitro.db

nitro.db is a lightweight and versatile database management package for Node.js, written in TypeScript. It provides an easy-to-use interface for storing, retrieving, and managing data using various storage options.

## Installation

To install nitro
db, use npm:

```bash
npm install nitro.db
```

## Usage

```typescript
import { database } from 'nitro.db';

// Initialize database with SQLite storage
const db = new database('sqlite', /* you can changed to mongodb or other*/'my_database.db');

// Set a key-value pair
db.set('myKey', 'myValue');

// Get a value by key
const value = db.get('myKey');
console.log(value); // Output: myValue
```

## Supported Storage Types

- SQLite
- JSON file
- MySQL
- YAML file
- MongoDB
- PostgreSQL
- In-memory cache

## Features

- Set and get key-value pairs
- Delete keys
- Check if a key exists
- Clear all data in a collection
- TTL (Time-to-Live) support for automatic data expiration
- Batch operations for setting and deleting multiple keys at once

## Documentation

For detailed documentation, including API reference and usage examples, refer to the [MyQuickDB Documentation](comingsoon),
## Contributing

Contributions are welcome! Fork the repository, make your changes, and submit a pull request. Please make sure to follow the coding guidelines and add tests for any new features.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
```

Replace placeholders like `your-documentation-link` and `LICENSE.md` with actual links and file names relevant to your project. This `README.md` provides a basic structure covering installation, usage, supported storage types, features, documentation, contributing guidelines, and license information. Adjust and expand it according to your project's specifics.
