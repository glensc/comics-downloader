import imaps, { ImapSimple } from "imap-simple";
import { BaseCommand } from "./BaseCommand";
import { IMAP_HOSTNAME, IMAP_PASSWORD, IMAP_PORT, IMAP_USERNAME } from "../config";

export class DownloadCommand extends BaseCommand {
  protected configure() {
    this
      .name("download")
      .arguments("<folder>")
      .description("Download emails to local directory")
  }

  protected async execute(folder: string): Promise<void> {
    const connection = await this.getConnection();
    await connection.openBox(folder);

    for await (const attachment of this.getAttachments(connection)) {
      console.log(attachment);
    }
  }

  private async* getAttachments(connection: ImapSimple) {
    const messages: any = await this.findMessages(connection);
    for (const message of messages) {
      const messagePath = this.formatDate(message.attributes.date);
      const parts = imaps.getParts(message.attributes.struct);
      const imageParts = parts.filter(part => {
        return part.type.toLowerCase() === 'image';
      });

      for (const part of imageParts) {
        const partData = await connection.getPartData(message, part);

        yield {
          filename: `${messagePath}_${part.id.replace(/[<>]/g, '')}_${part.params.name}`,
          size: part.size,
          data: partData,
        };
      }
    }
  }

  private async findMessages(connection: ImapSimple) {
    const searchCriteria = [
      "ALL",
    ];

    const fetchOptions = {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)'],
      struct: true,
      markSeen: false,
    };

    return connection.search(searchCriteria, fetchOptions);
  }

  private async getConnection() {
    const config = {
      imap: {
        user: IMAP_USERNAME,
        password: IMAP_PASSWORD,
        host: IMAP_HOSTNAME,
        port: IMAP_PORT,
        tls: true,
        tlsOptions: {
          // https://github.com/mscdex/node-imap/issues/705#issuecomment-391419426
          rejectUnauthorized: false,
        },
        authTimeout: 3000,
      }
    };

    return await imaps.connect(config);
  }

  private formatDate(d: Date) {
    const pad = (num: number) => `${num < 10 ? "0" : ""}${num}`;

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}
