import imaps from "imap-simple";
import { BaseCommand } from "./BaseCommand";
import { IMAP_HOSTNAME, IMAP_PASSWORD, IMAP_PORT, IMAP_USERNAME } from "../config";

export class DownloadCommand extends BaseCommand {
  protected configure() {
    this
      .name("download")
      .description("Download emails to local directory")
  }

  protected async execute(): Promise<void> {
    const connection = await this.getConnection();
  }

  private async getConnection() {
    const config = {
      imap: {
        user: IMAP_USERNAME,
        password: IMAP_PASSWORD,
        host: IMAP_HOSTNAME,
        port: IMAP_PORT,
        tls: true,
        authTimeout: 3000,
      }
    };

    return await imaps.connect(config);
  }
}
