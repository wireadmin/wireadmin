import fs from "fs";
import path from "path";

export default class FileManager {

  static readDirectoryFiles(dir: string): string[] {
    const files_: string[] = [];
    const files = fs.readdirSync(dir);
    for (const i in files) {
      const name = dir + '/' + files[i];
      if (!fs.statSync(name).isDirectory()) {
        files_.push(path.resolve(process.cwd(), name))
      }
    }
    return files_;
  }

  static readFile(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      throw new Error('file not found')
    }
    return fs.readFileSync(filePath, { encoding: 'utf8' })
  }

  static writeFile(filePath: string, content: string, forced: boolean = false): void {
    const dir_ = filePath.split('/')
    const dir = dir_.slice(0, dir_.length - 1).join('/')
    if (!fs.existsSync(dir) && forced) {
      fs.mkdirSync(dir, { mode: 0o744 })
    }
    fs.writeFileSync(filePath, content,{ encoding: 'utf8' })
  }

}
