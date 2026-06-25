import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  ChannelType,
  EmbedBuilder,
} from "discord.js";
import { upsertGuildConfig, getGuildConfig } from "../lib/db.js";

export const data = new SlashCommandBuilder()
  .setName("logs")
  .setDescription("Configure the logging system")
  .addSubcommand((sub) =>
    sub
      .setName("setchannel")
      .setDescription("Set the channel where all logs are sent")
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription("The channel to send logs in")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("disable")
      .setDescription("Disable all logging"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("settings")
      .setDescription("Show current log settings"),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const sub = interaction.options.getSubcommand();

  if (sub === "setchannel") {
    const channel = interaction.options.getChannel("channel", true);
    await upsertGuildConfig({ guildId, logChannelId: channel.id });
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#43b581")
          .setTitle("✅ Log Channel Set")
          .setDescription(`All server events will be logged in <#${channel.id}>.`)
          .addFields({
            name: "Events Logged",
            value: [
              "• Member joins / leaves",
              "• Bans & unbans",
              "• Role changes",
              "• Nickname changes",
              "• Timeouts",
              "• Message edits & deletes",
              "• Voice channel joins / leaves / moves",
              "• Channel creates & deletes",
              "• Role creates & deletes",
            ].join("\n"),
          }),
      ],
      ephemeral: true,
    });
    return;
  }

  if (sub === "disable") {
    await upsertGuildConfig({ guildId, logChannelId: null });
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#f04747")
          .setTitle("🚫 Logging Disabled")
          .setDescription("Server event logging has been turned off."),
      ],
      ephemeral: true,
    });
    return;
  }

  if (sub === "settings") {
    const config = await getGuildConfig(guildId);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#7289da")
          .setTitle("⚙️ Log Settings")
          .addFields({
            name: "Log Channel",
            value: config?.logChannelId ? `<#${config.logChannelId}>` : "Not set (logging disabled)",
            inline: true,
          }),
      ],
      ephemeral: true,
    });
  }
}
