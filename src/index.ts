import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import * as _ from 'lodash';

class QuickDB {
  private db: sqlite3.Database;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.db = new sqlite3.Database(filePath);
  }

  async push(key: string, value: any) {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(this.filePath);
    }
    const filePath = `${this.filePath}/${key}.json`;
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}));
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.push(value);
    fs.writeFileSync(filePath, JSON.stringify(data));
  }

  async set(key: string, value: any) {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(this.filePath);
    }
    const filePath = `${this.filePath}/${key}.json`;
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}));
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data = value;
    fs.writeFileSync(filePath, JSON.stringify(data));
  }

  async get(key: string) {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(this.filePath);
    }
    const filePath = `${this.filePath}/${key}.json`;
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  async remove(key: string) {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(this.filePath);
    }
    const filePath = `${this.filePath}/${key}.json`;
    if (!fs.existsSync(filePath)) {
      return;
    }
    fs.unlinkSync(filePath);
  }

  async fetch(key: string) {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(this.filePath);
    }
    const filePath = `${this.filePath}/${key}.json`;
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  async keys() {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(this.filePath);
    }
    const files = fs.readdirSync(this.filePath);
    return files.filter(file => file.endsWith('.json'));
  }

  async size() {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(this.filePath);
    }
    const files = fs.readdirSync(this.filePath);
    return files.length;
  }

  async sql(query: string) {
    return new Promise((resolve, reject) => {
      this.db.run(query, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async query(query: string) {
    return new Promise((resolve, reject) => {
      this.db.all(query, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async set(key: string, value: any) {
    return _.set(this.get(key), key, value);
  }

  async has(key: string) {
    return _.has(this.get(key), key);
  }

  async get(key: string) {
    return _.get(this.get(key), key);
  }

  async remove(key: string) {
    return _.remove(this.get(key), key);
  }

  async push(key: string, value: any) {
    return _.push(this.get(key), value);
  }

  async subtract(key: string, value: any) {
    return _.subtract(this.get(key), value);
  }

  async type(key: string) {
    return _.type(this.get(key), key);
  }

  async all() {
    return _.all(this.get(key));
  }
}

module.exports = QuickDB;
