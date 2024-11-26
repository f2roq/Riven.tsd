import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { CommandInteraction, EmbedBuilder } from 'discord.js';

@ApplyOptions<Command.Options>({
  name: 'help',
  description: 'Get help with Riven commands',
  preconditions: ['GuildOnly'],
})
export class rivenhelp extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('Riven Commands List')
      .setDescription('Here are the Riven command list you can use with this bot:')
      .setThumbnail('https://cdn.discordapp.com/attachments/1210343530321416212/1308039949060276275/005Qkq6Xgy1hcer4xm5sssssssa6j34k229nu1f.jpg?ex=673c7ea2&is=673b2d22&hm=1c7b546e9f8404619f7b012fa7e2e3fdcb0eb011126f05d08d89580a5b6b9010&')
      .setColor('#808080')
      .addFields(
        {
          name: '/add_streamer',
          value: '`/add_streamer [name] [streamurl] [liveurl] [channelid] [imageurl]`\n For example [Wenshen] (streamurl](https://www.huya.com/video/u/1339526366) (liveurl](https://www.huya.com/397545) [Channelid] [imageurl] *if you like to add embed image',
        },
        {
          name: '/remove_streamer',
          value: '`/remove_streamer [name]`\n For example [wenshen] to delete the [name] from the track list',
        },
        {
          name: '/riven_matchups',
          value: '`/riven_matchups`\n your guide to play riven S14',
        }

      )
      .setFooter({
        text: 'Tip: Use these commands wisely to manage streamers effectively',
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
