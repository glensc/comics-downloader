import * as fs from "fs";

export class FileSystem {
  public writeFile(path: string, content: string): void {
    fs.writeFileSync(path, content, "utf8");
  }
}
