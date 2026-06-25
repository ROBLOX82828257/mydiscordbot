import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export const data = new SlashCommandBuilder()
  .setName("mod")
  .setDescription("Moderation commands")
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)

  // ── ban ──────────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("ban")
      .setDescription("Ban a member from the server")
      .addUserOption((o) => o.setName("user").setDescription("User to ban").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("Reason for the ban"))
      .addIntegerOption((o) =>
        o.setName("delete_days")
          .setDescription("Days of messages to delete (0–7)")
          .setMinValue(0)
          .setMaxValue(7),
      ),
  )

  // ── unban ─────────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("unban")
      .setDescription("Unban a user by their ID")
      .addStringOption((o) => o.setName("user_id").setDescription("User ID to unban").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("Reason")),
  )

  // ── kick ──────────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("kick")
      .setDescription("Kick a member from the server")
      .addUserOption((o) => o.setName("user").setDescription("User to kick").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("Reason for the kick")),
  )

  // ── timeout ───────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("timeout")
      .setDescription("Timeout (mute) a member")
      .addUserOption((o) => o.setName("user").setDescription("User to timeout").setRequired(true))
      .addIntegerOption((o) =>
        o.setName("minutes")
          .setDescription("Duration in minutes (1–40320 / 28 days)")
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(40320),
      )
      .addStringOption((o) => o.setName("reason").setDescription("Reason")),
  )

  // ── untimeout ─────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("untimeout")
      .setDescription("Remove a timeout from a member")
      .addUserOption((o) => o.setName("user").setDescription("User to un-timeout").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("Reason")),
  )

  // ── warn ──────────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("warn")
      .setDescription("Send an official warning to a member")
      .addUserOption((o) => o.setName("user").setDescription("User to warn").setRequired(true))
      .addStringOption((o) => o.setName("reason").setDescription("Reason for the warning").setRequired(true)),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  const guild = interaction.guild!;
  const mod = interaction.user;
  const reason = interaction.options.getString("reason") ?? "No reason provided";

  await interaction.deferReply({ ephemeral: true });

  // ── ban ──────────────────────────────────────────────────────────
  if (sub === "ban") {
    const target = interaction.options.getUser("user", true);
    const deleteDays = interaction.options.getInteger("delete_days") ?? 0;

    try {
      await guild.members.ban(target.id, { reason, deleteMessageDays: deleteDays });
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#f04747")
            .setTitle("🔨 Member Banned")
            .addFields(
              { name: "User", value: `${target.tag} (${target.id})`, inline: true },
              { name: "Moderator", value: mod.tag, inline: true },
              { name: "Reason", value: reason },
            ),
        ],
      });
      await sendLog(guild, "#f04747", "🔨 Member Banned (Slash Command)", [
        { name: "User", value: `${target.tag} (<@${target.id}>)`, inline: true },
        { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
        { name: "Messages Deleted", value: `${deleteDays} day(s)`, inline: true },
        { name: "Reason", value: reason },
      ]);
    } catch {
      await interaction.editReply({ content: "❌ Failed to ban — check my role position and permissions." });
    }
    return;
  }

  // ── unban ─────────────────────────────────────────────────────────
  if (sub === "unban") {
    const userId = interaction.options.getString("user_id", true);
    try {
      await guild.members.unban(userId, reason);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#43b581")
            .setTitle("🔓 Member Unbanned")
            .addFields(
              { name: "User ID", value: userId, inline: true },
              { name: "Moderator", value: mod.tag, inline: true },
              { name: "Reason", value: reason },
            ),
        ],
      });
      await sendLog(guild, "#43b581", "🔓 Member Unbanned (Slash Command)", [
        { name: "User ID", value: userId, inline: true },
        { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
        { name: "Reason", value: reason },
      ]);
    } catch {
      await interaction.editReply({ content: "❌ Failed to unban — user may not be banned or ID is invalid." });
    }
    return;
  }

  // ── kick ──────────────────────────────────────────────────────────
  if (sub === "kick") {
    const target = interaction.options.getUser("user", true);
    const member = await guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ content: "❌ That user is not in this server." });
      return;
    }
    try {
      await member.kick(reason);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#faa61a")
            .setTitle("👢 Member Kicked")
            .addFields(
              { name: "User", value: `${target.tag} (${target.id})`, inline: true },
              { name: "Moderator", value: mod.tag, inline: true },
              { name: "Reason", value: reason },
            ),
        ],
      });
      await sendLog(guild, "#faa61a", "👢 Member Kicked (Slash Command)", [
        { name: "User", value: `${target.tag} (<@${target.id}>)`, inline: true },
        { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
        { name: "Reason", value: reason },
      ]);
    } catch {
      await interaction.editReply({ content: "❌ Failed to kick — check my role position and permissions." });
    }
    return;
  }

  // ── timeout ───────────────────────────────────────────────────────
  if (sub === "timeout") {
    const target = interaction.options.getUser("user", true);
    const minutes = interaction.options.getInteger("minutes", true);
    const member = await guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ content: "❌ That user is not in this server." });
      return;
    }
    try {
      const until = new Date(Date.now() + minutes * 60_000);
      await member.timeout(minutes * 60_000, reason);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ff7700")
            .setTitle("⏰ Member Timed Out")
            .addFields(
              { name: "User", value: `${target.tag} (${target.id})`, inline: true },
              { name: "Duration", value: `${minutes} minute(s)`, inline: true },
              { name: "Expires", value: `<t:${Math.floor(until.getTime() / 1000)}:R>`, inline: true },
              { name: "Moderator", value: mod.tag, inline: true },
              { name: "Reason", value: reason },
            ),
        ],
      });
      await sendLog(guild, "#ff7700", "⏰ Member Timed Out (Slash Command)", [
        { name: "User", value: `${target.tag} (<@${target.id}>)`, inline: true },
        { name: "Duration", value: `${minutes} minute(s)`, inline: true },
        { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
        { name: "Reason", value: reason },
      ]);
    } catch {
      await interaction.editReply({ content: "❌ Failed to timeout — check my role position and permissions." });
    }
    return;
  }

  // ── untimeout ─────────────────────────────────────────────────────
  if (sub === "untimeout") {
    const target = interaction.options.getUser("user", true);
    const member = await guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ content: "❌ That user is not in this server." });
      return;
    }
    try {
      await member.timeout(null, reason);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#43b581")
            .setTitle("✅ Timeout Removed")
            .addFields(
              { name: "User", value: `${target.tag} (${target.id})`, inline: true },
              { name: "Moderator", value: mod.tag, inline: true },
              { name: "Reason", value: reason },
            ),
        ],
      });
      await sendLog(guild, "#43b581", "✅ Timeout Removed (Slash Command)", [
        { name: "User", value: `${target.tag} (<@${target.id}>)`, inline: true },
        { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
        { name: "Reason", value: reason },
      ]);
    } catch {
      await interaction.editReply({ content: "❌ Failed to remove timeout." });
    }
    return;
  }

  // ── warn ──────────────────────────────────────────────────────────
  if (sub === "warn") {
    const target = interaction.options.getUser("user", true);

    // Try to DM the user
    try {
      await target.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#faa61a")
            .setTitle(`⚠️ Warning from ${guild.name}`)
            .setDescription(`You have received an official warning.`)
            .addFields({ name: "Reason", value: reason }),
        ],
      });
    } catch {
      // DMs disabled — that's fine
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("#faa61a")
          .setTitle("⚠️ Member Warned")
          .addFields(
            { name: "User", value: `${target.tag} (${target.id})`, inline: true },
            { name: "Moderator", value: mod.tag, inline: true },
            { name: "Reason", value: reason },
          ),
      ],
    });
    await sendLog(guild, "#faa61a", "⚠️ Member Warned", [
      { name: "User", value: `${target.tag} (<@${target.id}>)`, inline: true },
      { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
      { name: "Reason", value: reason },
    ]);
  }
}
