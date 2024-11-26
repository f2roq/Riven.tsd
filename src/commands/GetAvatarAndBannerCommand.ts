import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandType, UserContextMenuCommandInteraction, EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
  name: 'Get Avatar and Banner',
  description: 'Fetches a user\'s avatar and banner.',
})
export class GetAvatarAndBannerCommand extends Command {
  public override async registerApplicationCommands(registry: Command.Registry) {
    // Register the context menu command
    registry.registerContextMenuCommand((builder) =>
      builder
        .setName(this.name)
        .setType(ApplicationCommandType.User as number) // Cast to number to resolve type mismatch
    );
  }

  public override async contextMenuRun(interaction: UserContextMenuCommandInteraction) {
    try {
      // Fetching the target user and their guild member
      const user = await interaction.client.users.fetch(interaction.targetId);
      const member = await interaction.guild?.members.fetch(user.id).catch(() => null);

      // Fetching the user's banner and avatar
      const userBanner = user.bannerURL({ size: 2048, extension: 'png' }) || null;

      // Creating the embed
      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Avatar and Banner`)
        .setColor(member?.displayHexColor ?? 'Blurple')
        .setThumbnail(user.displayAvatarURL({ size: 2048, extension: 'png' }))
        .setImage(userBanner)
        .addFields([
          {
            name: 'Avatar',
            value: `[View Avatar](${user.displayAvatarURL({ size: 2048, extension: 'png' })})`,
            inline: true,
          },
          ...(userBanner
            ? [
                {
                  name: 'Banner',
                  value: `[View Banner](${userBanner})`,
                  inline: true,
                },
              ]
            : []),
        ])
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      // Sending the embed as a reply
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error fetching user avatar and banner:', error);
      await interaction.reply({ content: 'An error occurred while fetching the avatar and banner.', ephemeral: true });
    }
  }
}