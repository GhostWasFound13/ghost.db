import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export async function readJSONFile(filePath: string): Promise<any> {
    try {
        const data = await readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}

export async function writeJSONFile(filePath: string, data: any): Promise<void> {
    const jsonData = JSON.stringify(data, null, 2);
    await writeFile(filePath, jsonData, 'utf8');
}
