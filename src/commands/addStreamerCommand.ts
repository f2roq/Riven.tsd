import { Command } from '@sapphire/framework';
import { CommandInteraction, PermissionsBitField } from 'discord.js';
import { addStreamer } from '../database/models';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<Command.Options>({
  name: 'add_streamer',
  description: 'Add a new streamer'
})
export class AddStreamerCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    // Check if the member is available and if they have the ADMINISTRATOR permission
    if (!interaction.member || !interaction.memberPermissions || !interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({
        content: 'You do not have the required permissions (ADMINISTRATOR) to use this command.',
        ephemeral: true
      });
      return;
    }

    const name = interaction.options.get('name')?.value as string;
    const streamUrl = interaction.options.get('streamurl')?.value as string;
    const liveUrl = interaction.options.get('liveurl')?.value as string;
    const channelId = interaction.options.get('channelid')?.value as string;
    const imageUrl = interaction.options.get('imageurl')?.value as string || 'https://cdn.discordapp.com/attachments/1210343530321416212/1307867583659245639/005Qkq6Xgy1hcer4xddm5a6j34k229nu1f.jpg?ex=673bde1a&is=673a8c9a&hm=adae545d7c53d0ad1a634445c8d235652f6ce9e86a860001fc9850f9fe74ccb7&'; // Default to empty string if not provided
    const guildId = interaction.guildId!;

    // Basic validation for Huya URLs
    if (!streamUrl.includes('huya.com') || !liveUrl.includes('huya.com')) {
      await interaction.reply({ content: 'Please provide valid URLs from huya.com', ephemeral: true });
      return;
    }

    // Save the streamer information to the database
    await addStreamer(name, guildId, {
      streamUrl,
      liveUrl,
      channelId,
      imageUrl,
    });

    await interaction.reply({ content: `Streamer ${name} added successfully!`, ephemeral: true });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Streamer Name')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('streamurl')
            .setDescription('Stream URL')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('liveurl')
            .setDescription('Live URL')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('channelid')
            .setDescription('Discord Channel ID')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('imageurl')
            .setDescription('Embed Image URL')
            .setRequired(false)
        )
    );
  }
}
