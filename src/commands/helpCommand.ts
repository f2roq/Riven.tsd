import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { CommandInteraction, EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
  name: 'help',
  description: 'Get help with Riven commands',
})
export class HelpCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('Riven Commands List')
      .setDescription('Here are the commands you can use with this bot:')
      .setThumbnail('https://cdn.discordapp.com/attachments/1210343530321416212/1308039949060276275/005Qkq6Xgy1hcer4xm5sssssssa6j34k229nu1f.jpg?ex=673c7ea2&is=673b2d22&hm=1c7b546e9f8404619f7b012fa7e2e3fdcb0eb011126f05d08d89580a5b6b9010&')
      .setColor('#808080')
      .addFields(
        {
          name: '/ping',
          value: '`/ping`\nCheck if the bot is online and measure response latency.',
        },
        {
          name: '/ping',
          value: '`/ping`\nCheck if the bot is online and measure response latency.',
        },
        {
          name: '/reminder',
          value: '`/reminder [date] [message] [description] [Dm]`\n True/False Set reminder for yourself dm or server.',
        },
        {
          name: '/reddit',
          value: '`/reddit [subreddit]`\nGet posts from specified subreddit.',
        },
        {
          name: '/add_streamer',
          value: '`/add_streamer [name] [streamurl] [liveurl] [channelid] [imageurl(optional)]`\nAdd a new streamer to monitor for live notifications.',
        },
        {
          name: '/remove_streamer',
          value: '`/remove_streamer [name]`\nRemove a streamer from the monitoring list.',
        },
        {
          name: '/help',
          value: '`/help`\nDisplay this help message with all available commands.',
        }
      )
      .setFooter({
        text: 'Tip: Use these commands wisely to manage streamers effectively!',
        iconURL:
          'https://cdn.discordapp.com/attachments/1210343530321416212/1308039949060276275/005Qkq6Xgy1hcer4xm5sssssssa6j34k229nu1f.jpg?ex=673c7ea2&is=673b2d22&hm=1c7b546e9f8404619f7b012fa7e2e3fdcb0eb011126f05d08d89580a5b6b9010&', // Optional: Replace with your bot's icon URL
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description)
    );
  }
}
