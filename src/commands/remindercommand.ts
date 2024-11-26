import { Command } from '@sapphire/framework';
import {
  ChatInputCommandInteraction,
  CacheType,
  TextChannel,
  EmbedBuilder
} from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';
import { parse } from 'date-fns';

@ApplyOptions<Command.Options>({
  name: 'reminder',
  description: 'Set a reminder to notify yourself or others.',
  preconditions: ['GuildOnly'],
})
export class ReminderCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction<CacheType>) {
    await interaction.deferReply({ ephemeral: true }); // Immediate acknowledgment

    const timeOrDate = interaction.options.getString('time_or_date', true);
    const message = interaction.options.getString('message', true);
    const description = interaction.options.getString('description') ?? null;
    const isDm = interaction.options.getBoolean('dm') ?? false;

    const delay = this.parseTimeOrDateToMs(timeOrDate);
    if (delay === null) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000) // Error red
        .setTitle('Invalid Time or Date')
        .setDescription('Please use formats like `10m`, `1h`, `1d`, or `YYYY-MM-DD HH:mm`.')
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] }); // Use editReply after deferReply
      return;
    }

    const confirmationEmbed = new EmbedBuilder()
      .setColor(0x57f287) // Success green
      .setTitle('Reminder Set!')
      .setDescription(`Reminder for **${timeOrDate}** has been set.`)
      .addFields(
        { name: 'Message', value: message },
        ...(description ? [{ name: 'Description', value: description }] : [])
      )
      .setFooter({ text: isDm ? 'Reminder will be sent via DM.' : 'Reminder will be sent here.' })
      .setTimestamp();

    await interaction.editReply({ embeds: [confirmationEmbed] });

    setTimeout(async () => {
      const reminderEmbed = new EmbedBuilder()
        .setColor(0xf04747) // Notification red
        .setTitle('Reminder!')
        .setDescription(message)
        .addFields(
          ...(description ? [{ name: 'Description', value: description }] : [])
        )
        .setTimestamp();

      if (isDm) {
        try {
          await interaction.user.send({ embeds: [reminderEmbed] });
        } catch (error) {
          console.error(`Failed to send DM to ${interaction.user.tag}:`, error);
        }
      } else {
        await (interaction.channel as TextChannel)?.send({ embeds: [reminderEmbed] });
      }
    }, delay);
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('time_or_date')
            .setDescription('Time (e.g., 10m, 1h) or date (YYYY-MM-DD HH:mm).')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('message')
            .setDescription('The message for the reminder.')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('description')
            .setDescription('Additional details about the reminder.')
        )
        .addBooleanOption((option) =>
          option
            .setName('dm')
            .setDescription('Send the reminder as a DM (true) or public message (false).')
        )
    );
  }

  private parseTimeOrDateToMs(input: string): number | null {
    const relativeTimeRegex = /^(\d+)([smhd])$/i;
    const match = input.match(relativeTimeRegex);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();

      switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
      }
    }

    const parsedDate = parse(input, 'yyyy-MM-dd HH:mm', new Date());
    if (!isNaN(parsedDate.getTime())) {
      const delay = parsedDate.getTime() - Date.now();
      return delay > 0 ? delay : null;
    }

    return null;
  }
}
