import { Command } from "commander";

export abstract class BaseCommand extends Command {
  constructor() {
    super();

    this.configure();
    this.action(async (...args) => {
      try {
        await this.execute(...args);
      } catch (e) {
        console.error(e);
        process.exitCode = 1;
      }
    });
  }

  protected abstract configure(): void;

  protected abstract execute(...args: any[]): void;
}
