  import { Command } from '@sapphire/framework';
  import { CommandInteraction } from 'discord.js';

  export class PingCommand extends Command {
    public constructor(context: Command.Context, options: Command.Options) {
      super(context, {
        ...options,
        name: 'ping',
        description: 'Replies with pong!',
      });
    }

    public async chatInputRun(interaction: CommandInteraction) {
      await interaction.reply('Pong!');
    }
  }

