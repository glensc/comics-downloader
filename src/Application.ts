import { Command } from "commander";
import { DownloadCommand } from "./Command/DownloadCommand";

export class Application extends Command {
  constructor() {
    super();
    this.addCommand(new DownloadCommand());
  }
}
