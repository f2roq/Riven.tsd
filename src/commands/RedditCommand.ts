import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import {
  ColorResolvable,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  CommandInteraction,
  TextChannel,
  DMChannel
} from 'discord.js';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import axios from 'axios';
import Logger from '../logger';

@ApplyOptions<CommandOptions>({
  name: 'reddit',
  description: 'Get posts from reddit by specifying a subreddit',
  preconditions: ['GuildOnly'],
})
export class RedditCommand extends Command {
  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await interaction.deferReply();
    const channel = interaction.channel;

    if (!(channel instanceof TextChannel || channel instanceof DMChannel)) {
      return await interaction.reply('This command can only be used in a text or DM channel.');
    }

    const subreddit = interaction.options.getString('subreddit', true);
    const sort = interaction.options.getString('sort', true);

    if (['controversial', 'top'].includes(sort)) {
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('top_or_controversial')
          .setPlaceholder('Please select a time filter')
          .addOptions(optionsArray)
      );

      const menu = await channel.send({
        content: `:loud_sound: Do you want to get the ${sort} posts from past hour/week/month/year or all?`,
        components: [row]
      });

      const collector = menu.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 30000 // 30 seconds
      });

      collector.on('end', () => {
        if (menu) menu.delete().catch(Logger.error);
      });

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          i.reply({ content: 'This element is not for you!', ephemeral: true });
          return;
        } else {
          collector.stop();
          const timeFilter = i.values[0];
          await this.fetchFromReddit(interaction, subreddit, sort, timeFilter);
        }
      });
    } else {
      await this.fetchFromReddit(interaction, subreddit, sort);
    }
  }

  private async fetchFromReddit(
    interaction: Command.ChatInputCommandInteraction,
    subreddit: string,
    sort: string,
    timeFilter = 'day'
  ) {
    try {
      const data = await this.getData(subreddit, sort, timeFilter);
      const paginatedEmbed = new PaginatedMessage();

      for (const redditPost of data.children) {
        let color: ColorResolvable = 'Orange';

        if (redditPost.data.title.length > 255) {
          redditPost.data.title = redditPost.data.title.substring(0, 252) + '...';
        }

        if (redditPost.data.selftext.length > 1024) {
          redditPost.data.selftext =
            redditPost.data.selftext.substring(0, 1024) +
            `[Read More...](https://www.reddit.com${redditPost.data.permalink})`;
        }

        if (redditPost.data.over_18) color = 'Red';

        paginatedEmbed.addPageEmbed(embed =>
          embed
            .setColor(color)
            .setTitle(redditPost.data.title)
            .setURL(`https://www.reddit.com${redditPost.data.permalink}`)
            .setDescription(
              `${redditPost.data.over_18 ? '' : redditPost.data.selftext + '\n\n'}Upvotes: ${redditPost.data.score} :thumbsup:`
            )
            .setAuthor({ name: redditPost.data.author })
        );
      }

      await paginatedEmbed.run(interaction as any); // Cast to ensure compatibility
    } catch (error: any) {
      Logger.error(error);
      await interaction.followUp('An error occurred while fetching data from Reddit.');
    }
  }

  private async getData(subreddit: string, sort: string, timeFilter: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://www.reddit.com/r/${subreddit}/${sort}/.json?limit=10&t=${timeFilter || 'day'}`
      );
      const data = response.data.data;
      if (!data || !data.children.length) {
        throw new Error(`**${subreddit}** is a private subreddit or no posts found.`);
      }
      return data;
    } catch {
      throw new Error('Failed to fetch Reddit data.');
    }
  }

  public override registerApplicationCommands(registry: Command.Registry): void {
    registry.registerChatInputCommand(builder =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption(option =>
          option
            .setName('subreddit')
            .setDescription('Subreddit name')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('sort')
            .setDescription('Sort type: best, hot, top, new, controversial, rising')
            .setRequired(true)
            .addChoices(
              { name: 'Best', value: 'best' },
              { name: 'Hot', value: 'hot' },
              { name: 'New', value: 'new' },
              { name: 'Top', value: 'top' },
              { name: 'Controversial', value: 'controversial' },
              { name: 'Rising', value: 'rising' }
            )
        )
    );
  }
}

const optionsArray = [
  { label: 'hour', value: 'hour' },
  { label: 'week', value: 'week' },
  { label: 'month', value: 'month' },
  { label: 'year', value: 'year' },
  { label: 'all', value: 'all' }
];
