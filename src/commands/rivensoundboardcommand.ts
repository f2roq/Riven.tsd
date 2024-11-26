import { ApplyOptions } from '@sapphire/decorators';
import { Command, CommandOptions } from '@sapphire/framework';
import {
  CommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
  TextChannel,
  DMChannel,
  StringSelectMenuInteraction,
  ButtonInteraction,
  GuildMember,
  ButtonComponent,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  joinVoiceChannel,
  StreamType,
} from '@discordjs/voice';
import logger from "../logger";

interface Voiceline {
  line: string;
  url: string;
}

interface SkinsData {
  [key: string]: Voiceline[];
}

@ApplyOptions<CommandOptions>({
  name: 'riven-soundboard',
  description: 'Play Riven voicelines from different skins',
})
export class RivenSoundboardCommand extends Command {
  private skinsData: SkinsData = {};

  public constructor(context: Command.Context, options: CommandOptions) {
    super(context, options);
    this.loadSkinsData();
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
    );
  }

  private loadSkinsData() {
    const dataPath = path.join(__dirname, '../../data/riven_voicelines.json');
    try {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      this.skinsData = JSON.parse(rawData);
    } catch (error) {
      logger.error(`Failed to load skins data: ${error}`);
    }
  }

  public override async chatInputRun(interaction: CommandInteraction) {
    try {
      const skins = Object.keys(this.skinsData);
      if (skins.length === 0) {
        await interaction.reply({ content: 'No skins available at the moment.', ephemeral: true });
        return;
      }

      const dropdownMenu = this.createDropdownMenu(skins);

      const embed = new EmbedBuilder()
        .setTitle('Riven Soundboard')
        .setDescription('Select a skin to view its voicelines.')
        .setColor('#00FF00');

      await interaction.reply({
        embeds: [embed],
        components: [dropdownMenu],
      });

      this.setupCollectors(interaction, skins);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error in chatInputRun: ${error.message}`);
      } else {
        logger.error('Error in chatInputRun due to an unknown error.');
      }
      await interaction.reply({ content: 'An error occurred. Please try again later.', ephemeral: true });
    }
  }

  private createDropdownMenu(skins: string[]) {
    const options = skins.map((skin) => ({
      label: skin.charAt(0).toUpperCase() + skin.slice(1),
      value: skin,
    }));

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_skin')
        .setPlaceholder('Choose a skin')
        .addOptions(options)
    );
  }

  private setupCollectors(interaction: CommandInteraction, skins: string[]) {
    const channel = interaction.channel;
    
    if (channel instanceof TextChannel || channel instanceof DMChannel) {
      const collector = channel.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
      });

      collector.on('collect', async (i: StringSelectMenuInteraction) => {
        if (i.customId === 'select_skin') {
          const currentSkin = i.values[0];
          logger.info(`Skin selected: ${currentSkin}`);
          await this.updateVoicelineMenu(interaction, currentSkin);
          await i.deferUpdate();
        }
      });

      collector.on('end', async () => {
        logger.info('Skin selection collector ended.');
        await interaction.followUp({ content: 'Skin selection has ended.', ephemeral: true });
      });
    } else {
      logger.warn('Invalid channel type for message component collector.');
    }
  }

  private async updateVoicelineMenu(interaction: CommandInteraction, skin: string) {
    const voicelines = this.skinsData[skin];
    if (!voicelines || voicelines.length === 0) {
      logger.warn(`No voicelines found for skin: ${skin}`);
      await interaction.editReply({ content: 'No voicelines available for this skin.' });
      return;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_voiceline')
      .setPlaceholder('Choose a voiceline')
      .addOptions(voicelines.map((line, index) => ({
        label: line.line.substring(0, 100), // Truncate to 100 characters if needed
        value: index.toString(),
      })));

    const playButton = new ButtonBuilder()
      .setCustomId('play_voiceline')
      .setLabel('Play Selected Voiceline')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true); // Initially disabled

    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(playButton);

    const embed = new EmbedBuilder()
      .setTitle(`${skin.charAt(0).toUpperCase() + skin.slice(1)} Voicelines`)
      .setDescription('Select a voiceline from the dropdown menu and click the button to play it.')
      .setColor('#00FF00');

    await interaction.editReply({
      embeds: [embed],
      components: [selectRow, buttonRow],
    });

    this.setupVoicelineCollector(interaction, skin);
  }

  private setupVoicelineCollector(interaction: CommandInteraction, skin: string) {
    const channel = interaction.channel;
    if (channel instanceof TextChannel || channel instanceof DMChannel) {
      const collector = channel.createMessageComponentCollector({
        time: 300000, // 5 minutes
      });
  
      let selectedLineIndex: number | null = null;
  
      collector.on('collect', async (i) => {
        try {
          if (i.isStringSelectMenu() && i.customId === 'select_voiceline') {
            selectedLineIndex = parseInt(i.values[0]);
            await i.update({
              components: [
                i.message.components[0], // Keep the StringSelectMenu row as it is
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  // Correctly handle ButtonBuilder row
                  ButtonBuilder.from(i.message.components[1].components[0] as unknown as ButtonBuilder).setDisabled(false)
                )
              ]
            });
          } else if (i.isButton() && i.customId === 'play_voiceline' && selectedLineIndex !== null) {
            const selectedLine = this.skinsData[skin][selectedLineIndex];
            if (selectedLine?.url) {
              await this.playVoiceLine(interaction.member as GuildMember, selectedLine.url);
              await i.deferUpdate();
            }
          }
        } catch (error) {
          logger.error(`Error during voiceline collection: ${error}`);
          await i.reply({ content: 'An error occurred while processing your voiceline request.', ephemeral: true });
        }
      });
  
      collector.on('end', async () => {
        try {
          logger.info('Voiceline collector ended.');
          await interaction.editReply({
            content: 'Voiceline selection has ended.',
            components: [],
          });
        } catch (error) {
          logger.error(`Error when finishing voiceline collector: ${error}`);
        }
      });
    } else {
      logger.warn('Collector could not start. Invalid channel type.');
    }
  }

  private async playVoiceLine(member: GuildMember, url: string) {
    if (!member.voice.channel) {
      logger.warn('User is not in a voice channel.');
      return;
    }

    const connection = joinVoiceChannel({
      channelId: member.voice.channel.id,
      guildId: member.guild.id,
      adapterCreator: member.guild.voiceAdapterCreator,
    });

    const audioPlayer = createAudioPlayer();
    const resource = createAudioResource(url, { inputType: StreamType.Arbitrary });

    audioPlayer.play(resource);
    connection.subscribe(audioPlayer);

    audioPlayer.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });
  }
}