import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  OverwriteType,
} from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export const data = new SlashCommandBuilder()
  .setName("channel")
  .setDescription("Channel management commands")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

  // ── lock ──────────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("lock")
      .setDescription("Lock a channel — only mods can send messages")
      .addChannelOption((o) =>
        o.setName("channel")
          .setDescription("Channel to lock (defaults to current)")
          .addChannelTypes(ChannelType.GuildText),
      )
      .addStringOption((o) => o.setName("reason").setDescription("Reason")),
  )

  // ── unlock ────────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("unlock")
      .setDescription("Unlock a channel")
      .addChannelOption((o) =>
        o.setName("channel")
          .setDescription("Channel to unlock (defaults to current)")
          .addChannelTypes(ChannelType.GuildText),
      )
      .addStringOption((o) => o.setName("reason").setDescription("Reason")),
  )

  // ── slowmode ──────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("slowmode")
      .setDescription("Set slowmode on a channel")
      .addIntegerOption((o) =>
        o.setName("seconds")
          .setDescription("Slowmode delay in seconds (0 to disable, max 21600)")
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(21600),
      )
      .addChannelOption((o) =>
        o.setName("channel")
          .setDescription("Channel to apply slowmode to (defaults to current)")
          .addChannelTypes(ChannelType.GuildText),
      ),
  )

  // ── clear ─────────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("clear")
      .setDescription("Delete a number of recent messages")
      .addIntegerOption((o) =>
        o.setName("amount")
          .setDescription("Number of messages to delete (1–100)")
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100),
      )
      .addUserOption((o) =>
        o.setName("user").setDescription("Only delete messages from this user (optional)"),
      ),
  )

  // ── nuke ──────────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("nuke")
      .setDescription("⚠️ Clone the channel and delete the original, wiping all messages"),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild!;
  const mod = interaction.user;
  const reason = interaction.options.getString("reason") ?? "No reason provided";

  await interaction.deferReply({ ephemeral: true });

  // ── lock ──────────────────────────────────────────────────────────
  if (sub === "lock") {
    const rawChannel = interaction.options.getChannel("channel") ?? interaction.channel;
    const channel = await guild.channels.fetch(rawChannel!.id).catch(() => null);
    if (!channel || !channel.isTextBased() || channel.isDMBased() || channel.isThread() || !("permissionOverwrites" in channel)) {
      await interaction.editReply({ content: "❌ Invalid channel — cannot lock a thread channel." });
      return;
    }

    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: false,
      }, { reason });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#f04747")
            .setTitle("🔒 Channel Locked")
            .setDescription(`${channel.toString()} is now locked.`)
            .addFields({ name: "Reason", value: reason }),
        ],
      });

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#f04747")
            .setTitle("🔒 Channel Locked")
            .setDescription(`This channel has been locked by a moderator.\n**Reason:** ${reason}`),
        ],
      });

      await sendLog(guild, "#f04747", "🔒 Channel Locked", [
        { name: "Channel", value: channel.toString(), inline: true },
        { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
        { name: "Reason", value: reason },
      ]);
    } catch {
      await interaction.editReply({ content: "❌ Failed to lock channel — check my permissions." });
    }
    return;
  }

  // ── unlock ────────────────────────────────────────────────────────
  if (sub === "unlock") {
    const rawChannel = interaction.options.getChannel("channel") ?? interaction.channel;
    const channel = await guild.channels.fetch(rawChannel!.id).catch(() => null);
    if (!channel || !channel.isTextBased() || channel.isDMBased() || channel.isThread() || !("permissionOverwrites" in channel)) {
      await interaction.editReply({ content: "❌ Invalid channel — cannot unlock a thread channel." });
      return;
    }

    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: null,
      }, { reason });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#43b581")
            .setTitle("🔓 Channel Unlocked")
            .setDescription(`${channel.toString()} is now unlocked.`),
        ],
      });

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#43b581")
            .setTitle("🔓 Channel Unlocked")
            .setDescription("This channel has been unlocked."),
        ],
      });

      await sendLog(guild, "#43b581", "🔓 Channel Unlocked", [
        { name: "Channel", value: channel.toString(), inline: true },
        { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
        { name: "Reason", value: reason },
      ]);
    } catch {
      await interaction.editReply({ content: "❌ Failed to unlock channel." });
    }
    return;
  }

  // ── slowmode ──────────────────────────────────────────────────────
  if (sub === "slowmode") {
    const seconds = interaction.options.getInteger("seconds", true);
    const rawChannel = interaction.options.getChannel("channel") ?? interaction.channel;
    const channel = await guild.channels.fetch(rawChannel!.id).catch(() => null);
    if (!channel || !channel.isTextBased() || channel.isDMBased() || !("setRateLimitPerUser" in channel)) {
      await interaction.editReply({ content: "❌ Invalid channel." });
      return;
    }

    try {
      await (channel as any).setRateLimitPerUser(seconds, reason);
      const label = seconds === 0 ? "disabled" : `${seconds}s`;
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#7289da")
            .setTitle("🐢 Slowmode Updated")
            .addFields(
              { name: "Channel", value: channel.toString(), inline: true },
              { name: "Delay", value: label, inline: true },
            ),
        ],
      });
      await sendLog(guild, "#7289da", "🐢 Slowmode Changed", [
        { name: "Channel", value: channel.toString(), inline: true },
        { name: "Delay", value: label, inline: true },
        { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
      ]);
    } catch {
      await interaction.editReply({ content: "❌ Failed to set slowmode." });
    }
    return;
  }

  // ── clear ─────────────────────────────────────────────────────────
  if (sub === "clear") {
    const amount = interaction.options.getInteger("amount", true);
    const targetUser = interaction.options.getUser("user");
    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      await interaction.editReply({ content: "❌ Cannot purge this channel." });
      return;
    }

    try {
      const fetched = await channel.messages.fetch({ limit: 100 });
      let toDelete = [...fetched.values()].filter(
        (m) => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000, // 14 day limit
      );

      if (targetUser) {
        toDelete = toDelete.filter((m) => m.author.id === targetUser.id);
      }

      toDelete = toDelete.slice(0, amount);

      const deleted = await channel.bulkDelete(toDelete, true);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#7289da")
            .setTitle("🗑️ Messages Cleared")
            .addFields(
              { name: "Deleted", value: `${deleted.size} message(s)`, inline: true },
              { name: "Channel", value: channel.toString(), inline: true },
              targetUser ? { name: "Filtered by", value: targetUser.tag, inline: true } : { name: "\u200b", value: "\u200b", inline: true },
            ),
        ],
      });
      await sendLog(guild, "#7289da", "🗑️ Messages Purged", [
        { name: "Deleted", value: `${deleted.size} message(s)`, inline: true },
        { name: "Channel", value: channel.toString(), inline: true },
        { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
        ...(targetUser ? [{ name: "Filtered by", value: targetUser.tag, inline: true }] : []),
      ]);
    } catch {
      await interaction.editReply({ content: "❌ Failed to delete messages. Messages older than 14 days cannot be bulk-deleted." });
    }
    return;
  }

  // ── nuke ──────────────────────────────────────────────────────────
  if (sub === "nuke") {
    const channel = interaction.channel;
    if (!channel || channel.isDMBased() || !("clone" in channel)) {
      await interaction.editReply({ content: "❌ Cannot nuke this channel." });
      return;
    }

    try {
      const cloned = await (channel as any).clone({ reason: `Nuke by ${mod.tag}` });
      await (channel as any).delete(`Nuke by ${mod.tag}`);

      await cloned.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#f04747")
            .setTitle("💥 Channel Nuked")
            .setDescription(`This channel was nuked by **${mod.tag}**.`),
        ],
      });

      await sendLog(guild, "#f04747", "💥 Channel Nuked", [
        { name: "Channel", value: `#${cloned.name}`, inline: true },
        { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
      ]);
    } catch {
      await interaction.editReply({ content: "❌ Failed to nuke channel." });
    }
  }
}
