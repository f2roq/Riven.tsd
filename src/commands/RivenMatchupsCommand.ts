import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import {
  CommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ColorResolvable,
  ComponentType,
  TextChannel,
  DMChannel,
  StringSelectMenuInteraction,
  Client
} from 'discord.js';
import fs from 'fs';
import path from 'path';

@ApplyOptions<CommandOptions>({
  name: 'riven-matchups',
  description: 'Select a Riven matchup and view its details.',
  preconditions: ['GuildOnly'],
})
export class RivenMatchupsCommand extends Command {
  private matchupsFolderPath: string;

  constructor(context: Command.Context, options: Command.Options) {
    super(context, options);
    this.matchupsFolderPath = path.join(__dirname, '../../data/assets/matchups');
  }

  public override async chatInputRun(interaction: CommandInteraction) {
    if (!fs.existsSync(this.matchupsFolderPath)) {
      console.error('Matchups directory not found at:', this.matchupsFolderPath);
      await interaction.reply({
        content: 'The matchups data is not available right now. Please contact the bot administrator.',
        ephemeral: true,
      });
      return;
    }

    const matchupFiles = fs.readdirSync(this.matchupsFolderPath).filter(file => file.endsWith('.json') && file !== 'matchups.json');
    const matchupChoices = matchupFiles.map(file => ({
      label: file.replace('.json', ''),
      value: file.replace('.json', ''),
    }));

    const pages: { label: string, value: string }[][] = [];
    for (let i = 0; i < matchupChoices.length; i += 25) {
      pages.push(matchupChoices.slice(i, i + 25));
    }

    const embeds = [
      new EmbedBuilder()
        .setTitle('Riven Matchups')
        .setColor('#FFE5E5')
        .setThumbnail('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/29.jpg')
        .setDescription('Select a matchup from the menu to get detailed information.')
    ];

    const actions = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_matchup')
        .setPlaceholder('Select a matchup')
        .addOptions(pages[0])
    );

    const buttonActions = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('next_page').setLabel('Next Page').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('previous_page').setLabel('Previous Page').setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      embeds,
      components: [actions, buttonActions],
    });

    const channel = interaction.channel;
    if (!(channel instanceof TextChannel || channel instanceof DMChannel)) {
      await interaction.followUp({
        content: 'This channel does not support interaction components.',
        ephemeral: true,
      });
      return;
    }

    const collector = channel.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 100000,
    });

    let currentPage = 0;

    collector.on('collect', async (i: StringSelectMenuInteraction) => {
      const selectedChampion = i.values[0];
      await this.displayMatchupDetails(interaction, selectedChampion);
      await i.deferUpdate();
    });

    const buttonCollector = channel.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
    });

    buttonCollector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.customId === 'next_page') {
        currentPage = Math.min(currentPage + 1, pages.length - 1);
      } else if (buttonInteraction.customId === 'previous_page') {
        currentPage = Math.max(currentPage - 1, 0);
      }

      const newSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_matchup')
        .setPlaceholder('Select a matchup')
        .addOptions(pages[currentPage]);

      const newActions = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(newSelectMenu);

      await buttonInteraction.update({
        components: [newActions, buttonActions],
      });
    });

    buttonCollector.on('end', async () => {
      await interaction.followUp({
        content: 'The selection has ended.',
        ephemeral: true,
      });
    });
  }

  private async displayMatchupDetails(interaction: CommandInteraction, selectedChampion: string) {
    const championFilePath = path.join(this.matchupsFolderPath, `${selectedChampion}.json`);

    if (!fs.existsSync(championFilePath)) {
      const emptyEmbed = new EmbedBuilder()
        .setTitle(`${selectedChampion} Matchup`)
        .setColor('#808080')
        .setDescription('No matchup data found.');

      await interaction.followUp({
        content: 'Sorry, no data available for the selected matchup.',
        embeds: [emptyEmbed],
        ephemeral: true,
      });
      return;
    }

    try {
      const matchup = JSON.parse(fs.readFileSync(championFilePath, 'utf-8'));
      const color: ColorResolvable = matchup.difficulty === 'Hard' ? 'Red' : 'Green';

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${selectedChampion} Matchup`)
        .setDescription(matchup.comments || 'No comments available for this matchup.')
        .setThumbnail(matchup.image || 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/29.jpg')
        .addFields(
          { name: 'Starter Items', value: matchup.items?.join(', ') || 'Default', inline: true },
          { name: 'Difficulty', value: matchup.difficulty || 'Even', inline: true },
          { name: 'Runes', value: matchup.runes || 'Conqueror + Sorcery (Nimbus Cloak + Transcendence)', inline: true },
          { name: 'Cooldowns', value: await this.getCooldownDetails(interaction, matchup), inline: false },
          { name: 'Notes', value: matchup.notes || 'No additional notes available.', inline: false }
        );

      await interaction.followUp({
        embeds: [embed],
        ephemeral: false,
      });
    } catch (error) {
      console.error('Error displaying matchup details:', error);

      const errorEmbed = new EmbedBuilder()
        .setTitle('Error')
        .setColor('Red')
        .setDescription('An error occurred while fetching the matchup details.');

      await interaction.followUp({
        content: 'An error occurred while processing the matchup details.',
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  }

  private async getCooldownDetails(interaction: CommandInteraction, matchup: any) {
    const getEmoji = async (emojiNameOrId: string) => {
      // Retrieve the emoji by name or ID
      const emoji = await this.getEmojiByNameOrId(interaction.client, emojiNameOrId);
      return emoji || "";  // Return the emoji or an empty string if not found
    };
  
    // Build the string with the emoji first, then the cooldown value
    return `
  **Q:** ${await getEmoji(matchup.emojis?.Q || '')} ${matchup.cooldowns?.Q || 'No Cd'}
  **W:** ${await getEmoji(matchup.emojis?.W || '')} ${matchup.cooldowns?.W || 'No Cd'}
  **E:** ${await getEmoji(matchup.emojis?.E || '')} ${matchup.cooldowns?.E || 'No Cd'}
  **R:** ${await getEmoji(matchup.emojis?.R || '')} ${matchup.cooldowns?.R || 'No Cd'}
  **Passive:** ${await getEmoji(matchup.emojis?.Passive || '')} ${matchup.cooldowns?.Passive || 'No Cd'}
    `;
  }
  
  private async getEmojiByNameOrId(client: Client, emojiNameOrId: string): Promise<string> {
    // Search for the emoji by either its name or ID in the emoji cache
    const emoji = client.emojis.cache.find(e => e.name === emojiNameOrId || e.id === emojiNameOrId);
    return emoji ? emoji.toString() : emojiNameOrId; // Return the emoji or fallback to the emojiNameOrId string
  }
  
}
