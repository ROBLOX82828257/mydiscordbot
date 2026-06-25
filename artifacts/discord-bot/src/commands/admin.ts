import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ActivityType,
} from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export const data = new SlashCommandBuilder()
  .setName("admin")
  .setDescription("Server administration commands")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

  // ── role ──────────────────────────────────────────────────────────
  .addSubcommandGroup((g) =>
    g.setName("role").setDescription("Manage member roles")
      .addSubcommand((s) =>
        s.setName("add")
          .setDescription("Add a role to a member")
          .addUserOption((o) => o.setName("user").setDescription("Target user").setRequired(true))
          .addRoleOption((o) => o.setName("role").setDescription("Role to add").setRequired(true)),
      )
      .addSubcommand((s) =>
        s.setName("remove")
          .setDescription("Remove a role from a member")
          .addUserOption((o) => o.setName("user").setDescription("Target user").setRequired(true))
          .addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true)),
      ),
  )

  // ── nick ──────────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("nick")
      .setDescription("Change or reset a member's nickname")
      .addUserOption((o) => o.setName("user").setDescription("Target user").setRequired(true))
      .addStringOption((o) => o.setName("nickname").setDescription("New nickname (leave blank to reset)")),
  )

  // ── serverinfo ────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("serverinfo").setDescription("Show server statistics"),
  )

  // ── userinfo ──────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("userinfo")
      .setDescription("Show info about a user")
      .addUserOption((o) => o.setName("user").setDescription("User to look up (defaults to you)")),
  )

  // ── announce ──────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("announce")
      .setDescription("Send an embedded announcement to a channel")
      .addStringOption((o) => o.setName("message").setDescription("Announcement text").setRequired(true))
      .addChannelOption((o) => o.setName("channel").setDescription("Channel to send to (defaults to current)"))
      .addStringOption((o) => o.setName("title").setDescription("Embed title")),
  )

  // ── dmall ─────────────────────────────────────────────────────────
  .addSubcommand((s) =>
    s.setName("dmall")
      .setDescription("⚠️ Send a DM to every human member of the server")
      .addStringOption((o) =>
        o.setName("message").setDescription("Message to send").setRequired(true),
      )
      .addStringOption((o) =>
        o.setName("title").setDescription("Embed title (optional)"),
      ),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const sub = interaction.options.getSubcommand();
  const group = interaction.options.getSubcommandGroup(false);
  const guild = interaction.guild!;
  const mod = interaction.user;

  await interaction.deferReply({ ephemeral: true });

  // ── role add / remove ─────────────────────────────────────────────
  if (group === "role") {
    const target = interaction.options.getUser("user", true);
    const role = interaction.options.getRole("role", true);
    const member = await guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ content: "❌ User not found in this server." });
      return;
    }

    const botMember = await guild.members.fetchMe();
    if (role.position >= botMember.roles.highest.position) {
      await interaction.editReply({ content: `❌ I can't manage ${role.toString()} — it's above my highest role.` });
      return;
    }

    try {
      if (sub === "add") {
        await member.roles.add(role.id);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("#43b581")
              .setTitle("✅ Role Added")
              .addFields(
                { name: "User", value: `${target.tag} (<@${target.id}>)`, inline: true },
                { name: "Role", value: role.toString(), inline: true },
              ),
          ],
        });
        await sendLog(guild, "#43b581", "🏷️ Role Added (Admin Command)", [
          { name: "User", value: `${target.tag} (<@${target.id}>)`, inline: true },
          { name: "Role", value: role.toString(), inline: true },
          { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
        ]);
      } else {
        await member.roles.remove(role.id);
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("#f04747")
              .setTitle("✅ Role Removed")
              .addFields(
                { name: "User", value: `${target.tag} (<@${target.id}>)`, inline: true },
                { name: "Role", value: role.toString(), inline: true },
              ),
          ],
        });
        await sendLog(guild, "#f04747", "🏷️ Role Removed (Admin Command)", [
          { name: "User", value: `${target.tag} (<@${target.id}>)`, inline: true },
          { name: "Role", value: role.toString(), inline: true },
          { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
        ]);
      }
    } catch {
      await interaction.editReply({ content: "❌ Failed to update roles." });
    }
    return;
  }

  // ── nick ──────────────────────────────────────────────────────────
  if (sub === "nick") {
    const target = interaction.options.getUser("user", true);
    const nickname = interaction.options.getString("nickname") ?? null;
    const member = await guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ content: "❌ User not found in this server." });
      return;
    }

    try {
      await member.setNickname(nickname, `Changed by ${mod.tag}`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#7289da")
            .setTitle("✏️ Nickname Updated")
            .addFields(
              { name: "User", value: `${target.tag} (<@${target.id}>)`, inline: true },
              { name: "Nickname", value: nickname ?? "*(reset)*", inline: true },
            ),
        ],
      });
      await sendLog(guild, "#7289da", "✏️ Nickname Changed (Admin Command)", [
        { name: "User", value: `${target.tag} (<@${target.id}>)`, inline: true },
        { name: "New Nickname", value: nickname ?? "*(reset)*", inline: true },
        { name: "Moderator", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
      ]);
    } catch {
      await interaction.editReply({ content: "❌ Failed to change nickname — I may not be able to edit this member's nickname." });
    }
    return;
  }

  // ── serverinfo ────────────────────────────────────────────────────
  if (sub === "serverinfo") {
    const fetchedGuild = await guild.fetch();
    const members = await guild.members.fetch();
    const bots = members.filter((m) => m.user.bot).size;
    const humans = members.size - bots;
    const channels = guild.channels.cache;
    const textChannels = channels.filter((c) => c.isTextBased() && !c.isDMBased()).size;
    const voiceChannels = channels.filter((c) => c.isVoiceBased()).size;
    const roles = guild.roles.cache.size - 1; // subtract @everyone

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("#7289da")
          .setTitle(`📊 ${fetchedGuild.name}`)
          .setThumbnail(fetchedGuild.iconURL() ?? null)
          .addFields(
            { name: "👑 Owner", value: `<@${fetchedGuild.ownerId}>`, inline: true },
            { name: "📅 Created", value: `<t:${Math.floor(fetchedGuild.createdTimestamp / 1000)}:D>`, inline: true },
            { name: "🌐 Region", value: fetchedGuild.preferredLocale, inline: true },
            { name: "👥 Members", value: `${fetchedGuild.memberCount} total\n${humans} humans / ${bots} bots`, inline: true },
            { name: "💬 Channels", value: `${textChannels} text / ${voiceChannels} voice`, inline: true },
            { name: "🎭 Roles", value: String(roles), inline: true },
            { name: "🚀 Boost Level", value: `Level ${fetchedGuild.premiumTier} (${fetchedGuild.premiumSubscriptionCount ?? 0} boosts)`, inline: true },
            { name: "🆔 Server ID", value: fetchedGuild.id, inline: true },
          )
          .setFooter({ text: `Verification: ${fetchedGuild.verificationLevel}` }),
      ],
    });
    return;
  }

  // ── userinfo ──────────────────────────────────────────────────────
  if (sub === "userinfo") {
    const target = interaction.options.getUser("user") ?? mod;
    const member = await guild.members.fetch(target.id).catch(() => null);

    const roles = member?.roles.cache
      .filter((r) => r.name !== "@everyone")
      .sort((a, b) => b.position - a.position)
      .map((r) => r.toString())
      .join(", ") || "None";

    const embed = new EmbedBuilder()
      .setColor("#7289da")
      .setTitle(`👤 ${target.tag}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "🆔 User ID", value: target.id, inline: true },
        { name: "🤖 Bot", value: target.bot ? "Yes" : "No", inline: true },
        { name: "📅 Account Created", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>`, inline: true },
      );

    if (member) {
      embed.addFields(
        { name: "📥 Joined Server", value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:D>` : "Unknown", inline: true },
        { name: "📛 Nickname", value: member.nickname ?? "None", inline: true },
        { name: "⏰ Timed Out", value: member.communicationDisabledUntil ? `<t:${Math.floor(member.communicationDisabledUntilTimestamp! / 1000)}:R>` : "No", inline: true },
        { name: `🎭 Roles (${member.roles.cache.size - 1})`, value: roles.slice(0, 1024) },
      );
    }

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // ── announce ──────────────────────────────────────────────────────
  if (sub === "announce") {
    const message = interaction.options.getString("message", true);
    const title = interaction.options.getString("title") ?? "📢 Announcement";
    const rawChannel = interaction.options.getChannel("channel") ?? interaction.channel;
    const channel = await guild.channels.fetch(rawChannel!.id).catch(() => null);
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      await interaction.editReply({ content: "❌ Invalid channel." });
      return;
    }

    try {
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#7289da")
            .setTitle(title)
            .setDescription(message)
            .setFooter({ text: `Announced by ${mod.tag}` })
            .setTimestamp(),
        ],
      });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("#43b581")
            .setTitle("✅ Announcement Sent")
            .addFields({ name: "Channel", value: channel.toString() }),
        ],
      });

      await sendLog(guild, "#7289da", "📢 Announcement Sent", [
        { name: "Channel", value: channel.toString(), inline: true },
        { name: "By", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
        { name: "Message", value: message.slice(0, 1020) },
      ]);
    } catch {
      await interaction.editReply({ content: "❌ Failed to send announcement." });
    }
    return;
  }

  // ── dmall ─────────────────────────────────────────────────────────
  if (sub === "dmall") {
    const message = interaction.options.getString("message", true);
    const title = interaction.options.getString("title") ?? `📢 Message from ${guild.name}`;

    // Fetch all members first
    const members = await guild.members.fetch();
    const humans = members.filter((m) => !m.user.bot);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("#faa61a")
          .setTitle("⏳ Sending DMs...")
          .setDescription(`Sending to **${humans.size}** members. This may take a while.`),
      ],
    });

    const embed = new EmbedBuilder()
      .setColor("#7289da")
      .setTitle(title)
      .setDescription(message)
      .setFooter({ text: guild.name, iconURL: guild.iconURL() ?? undefined })
      .setTimestamp();

    let sent = 0;
    let failed = 0;

    for (const [, member] of humans) {
      try {
        await member.send({ embeds: [embed] });
        sent++;
      } catch {
        failed++;
      }
      // Respect Discord rate limits — 1 DM per 100ms
      await new Promise((r) => setTimeout(r, 100));
    }

    await interaction.followUp({
      ephemeral: true,
      embeds: [
        new EmbedBuilder()
          .setColor("#43b581")
          .setTitle("✅ DM Blast Complete")
          .addFields(
            { name: "✅ Delivered", value: String(sent), inline: true },
            { name: "❌ Failed", value: `${failed} (DMs disabled)`, inline: true },
            { name: "📨 Total", value: String(humans.size), inline: true },
          ),
      ],
    });

    await sendLog(guild, "#7289da", "📨 DM Blast Sent", [
      { name: "By", value: `${mod.tag} (<@${mod.id}>)`, inline: true },
      { name: "Delivered", value: String(sent), inline: true },
      { name: "Failed", value: String(failed), inline: true },
      { name: "Message", value: message.slice(0, 1020) },
    ]);
  }
}
