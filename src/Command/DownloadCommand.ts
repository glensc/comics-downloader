import { BaseCommand } from "./BaseCommand";

export class DownloadCommand extends BaseCommand {
  protected configure() {
    this
      .name("download")
      .description("Download emails to local directory")
  }

  protected async execute(): Promise<void> {
  }
}
