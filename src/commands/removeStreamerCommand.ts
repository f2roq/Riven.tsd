import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import { CommandInteraction, PermissionsBitField } from 'discord.js';
import { removeStreamer } from '../database/models';

@ApplyOptions<CommandOptions>({
  name: 'remove_streamer',
  description: 'Remove a streamer from the database',
  preconditions: ['GuildOnly'],
})
export class RemoveStreamerCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    // Check if the member has the ADMINISTRATOR permission
    if (!interaction.member || !interaction.memberPermissions || !interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({
        content: 'You do not have the required permissions (ADMINISTRATOR) to use this command.',
        ephemeral: true
      });
      return;
    }

    // Use get('name') to get the 'name' option, and cast to string
    const name = interaction.options.get('name')?.value as string; // Access as string
    const guildId = interaction.guildId!;

    // Remove from the database
    const result = await removeStreamer(name, guildId);

    if (result) {
      // Assuming removeStreamer returns true/false or a result indicating success/failure
      await interaction.reply({ content: `Streamer ${name} removed successfully!`, ephemeral: true });
    } else {
      await interaction.reply({ content: `Streamer ${name} not found.`, ephemeral: true });
    }
  }

  public override registerApplicationCommands(registry: Command.Registry): void {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(option =>
          option
            .setName('name')
            .setDescription('Streamer Name')
            .setRequired(true)
        )
    );
  }
}
