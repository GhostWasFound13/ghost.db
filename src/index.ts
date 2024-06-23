import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import * as _ from 'lodash';

export class QuickDB {
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

  async has(key: string) {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(this.filePath);
    }
    const filePath = `${this.filePath}/${key}.json`;
    if (!fs.existsSync(filePath)) {
      return false;
    }
    return true;
  }

  async subtract(key: string, value: any) {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(this.filePath);
    }
    const filePath = `${this.filePath}/${key}.json`;
    if (!fs.existsSync(filePath)) {
      return;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data = data.filter(item => item !== value);
    fs.writeFileSync(filePath, JSON.stringify(data));
  }

  async type(key: string) {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(this.filePath);
    }
    const filePath = `${this.filePath}/${key}.json`;
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return typeof JSON.parse(fs.readFileSync(filePath, 'utf8'))[0];
  }

  async all() {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(this.filePath);
    }
    const files = fs.readdirSync(this.filePath);
    return files.map(file => JSON.parse(fs.readFileSync(`${this.filePath}/${file}`, 'utf8')));
  }
}

export default QuickDB
