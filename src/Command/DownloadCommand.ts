import imaps, { ImapSimple } from "imap-simple";
import { parse as parseHtml } from "node-html-parser";
import { BaseCommand } from "./BaseCommand";
import { IMAP_HOSTNAME, IMAP_PASSWORD, IMAP_PORT, IMAP_USERNAME } from "../config";
import { FileSystem } from "../FileSystem";

export class DownloadCommand extends BaseCommand {
  protected configure() {
    this
      .name("download")
      .arguments("<folder>")
      .description("Download emails to local directory")
  }

  protected async execute(folder: string): Promise<void> {
    const connection = await this.getConnection();

    const fs = new FileSystem();
    for await (const attachment of this.getAttachments(connection, folder)) {
      if (fs.exists(attachment.filename)) {
        console.log(`Skipping existing file: ${attachment.filename}`);
        continue;
      }

      console.log(attachment);
      fs.writeFile(attachment.filename, await attachment.getData());
      fs.touch(attachment.filename, attachment.date);
    }

    connection.end();
  }

  private async* getAttachments(connection: ImapSimple, folder: string) {
    await connection.openBox(folder);

    const messages: any = await this.findMessages(connection);
    for (const message of messages) {
      const subject = message.parts[0].body.subject;
      const date = message.parts[0].body.date;
      console.log(`Processing ${date}: ${subject}`);
      const parts = imaps.getParts(message.attributes.struct);
      const cids = await this.getContentIds(connection, message, parts);
      const imageParts = this.getImageParts(parts);
      console.log(`- ${imageParts.length} images`);

      const messagePath = this.formatDate(message.attributes.date);
      for (const part of imageParts) {
        const cid = part.id.replace(/[<>]/g, '');
        let filename = part.params.name;
        if (cids[cid] && cids[cid].alt) {
          const alt = this.translit(cids[cid].alt);
          filename = `${alt}_${filename}`;
        }
        yield {
          filename: `${messagePath}_${cid}_${filename}`,
          date: message.attributes.date,
          size: part.size,
          getData: () => connection.getPartData(message, part),
        };
      }
    }

    await connection.closeBox(false);
  }

  private async getContentIds(connection: ImapSimple, message: any, parts: any[]) {
    const part = this.getHtmlPart(parts);
    const html = await connection.getPartData(message, part);

    const root = parseHtml(html);
    const images = root.querySelectorAll('img');

    const ids: any = {};
    for (const image of images) {
      const src = image.getAttribute("src");
      const alt = image.getAttribute("alt");
      const cid = (src || "").replace(/^cid:/, "");

      ids[cid] = {
        src,
        alt,
      };
    }

    return ids;
  }

  private getHtmlPart(parts: any[]) {
    const [part] = parts
      .filter(part => {
        return part.type.toLowerCase() === 'text' && part.subtype.toLowerCase() === 'html';
      });

    if (!part) {
      throw new Error("Missing html part");
    }

    return part;
  }

  private getImageParts(parts: any[]) {
    return parts
      .filter(part => {
        return part.type.toLowerCase() === 'image';
      });
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

  private translit(filename: string, maxLength = 150) {
    if (filename.match("\u{FFFD}")) {
      // Replace some well known Unicode Replacement character placements (0xEF 0xBF 0xBD)
      filename = filename.replace(`M\u{FFFD}rakarud`, "Mürakarud");
    }

    // Shorten
    filename = filename.replace("Cyanide and Happiness, a daily webcomic", "Cyanide and Happiness");

    // Spaces, Slashes to underscores
    filename = filename.replace(/[\s\/]+/g, '_');

    if (filename.length > maxLength) {
      let length = 0;
      const parts = [];
      for (const part of filename.split(/_+/)) {
        length += part.length + 1;
        if (length > maxLength) {
          break;
        }
        parts.push(part);
      }
      filename = parts.join("_");
    }

    return filename;
  }

  private formatDate(d: Date) {
    const pad = (num: number) => `${num < 10 ? "0" : ""}${num}`;

    return `${d.getFullYear()}/${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}
