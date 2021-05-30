import * as fs from "fs";

export class FileSystem {
  public exists(path: string): boolean {
    return fs.existsSync(path);
  }

  public writeFile(path: string, content: string): void {
    fs.writeFileSync(path, content, "utf8");
  }

  public mkdir(path: string): void {
    fs.mkdirSync(path);
  }
}
