import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  ChannelType,
  EmbedBuilder,
} from "discord.js";
import { upsertGuildConfig, getGuildConfig } from "../lib/db.js";

export const data = new SlashCommandBuilder()
  .setName("welcome")
  .setDescription("Configure the welcome system")
  .addSubcommand((sub) =>
    sub
      .setName("setchannel")
      .setDescription("Set the channel where welcome messages are sent")
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription("The channel to send welcome messages in")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("setmessage")
      .setDescription("Set the welcome message. Use {user}, {username}, {server}, {count}")
      .addStringOption((opt) =>
        opt
          .setName("message")
          .setDescription("The welcome message text")
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("setbanner")
      .setDescription("Set a banner image URL shown on welcome messages")
      .addStringOption((opt) =>
        opt
          .setName("url")
          .setDescription("Direct image URL for the banner (leave blank to remove)")
          .setRequired(false),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("disable")
      .setDescription("Disable welcome messages"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("settings")
      .setDescription("Show current welcome settings"),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const sub = interaction.options.getSubcommand();

  if (sub === "setchannel") {
    const channel = interaction.options.getChannel("channel", true);
    await upsertGuildConfig({ guildId, welcomeChannelId: channel.id });
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#43b581")
          .setTitle("✅ Welcome Channel Set")
          .setDescription(`Welcome messages will be sent in <#${channel.id}>.`),
      ],
      ephemeral: true,
    });
    return;
  }

  if (sub === "setmessage") {
    const message = interaction.options.getString("message", true);
    await upsertGuildConfig({ guildId, welcomeMessage: message });
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#43b581")
          .setTitle("✅ Welcome Message Set")
          .setDescription(`**New message:**\n${message}`)
          .addFields({ name: "Variables", value: "`{user}` — mention\n`{username}` — username\n`{server}` — server name\n`{count}` — member count" }),
      ],
      ephemeral: true,
    });
    return;
  }

  if (sub === "setbanner") {
    const url = interaction.options.getString("url") ?? null;
    await upsertGuildConfig({ guildId, welcomeBannerUrl: url });
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#43b581")
          .setTitle(url ? "✅ Welcome Banner Set" : "✅ Welcome Banner Removed")
          .setDescription(url ? `Banner URL saved. It will appear on welcome messages.` : "Banner has been removed.")
          .setImage(url ?? null),
      ],
      ephemeral: true,
    });
    return;
  }

  if (sub === "disable") {
    await upsertGuildConfig({ guildId, welcomeChannelId: null });
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#f04747")
          .setTitle("🚫 Welcome Disabled")
          .setDescription("Welcome messages have been turned off."),
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
          .setTitle("⚙️ Welcome Settings")
          .addFields(
            {
              name: "Welcome Channel",
              value: config?.welcomeChannelId ? `<#${config.welcomeChannelId}>` : "Not set",
              inline: true,
            },
            {
              name: "Banner",
              value: config?.welcomeBannerUrl ? `[View Image](${config.welcomeBannerUrl})` : "None",
              inline: true,
            },
            {
              name: "Message",
              value: config?.welcomeMessage ?? "Welcome to the server, {user}!",
            },
          )
          .setImage(config?.welcomeBannerUrl ?? null),
      ],
      ephemeral: true,
    });
  }
}
