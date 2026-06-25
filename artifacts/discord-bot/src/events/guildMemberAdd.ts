import { AttachmentBuilder, EmbedBuilder, type GuildMember } from "discord.js";
import { getGuildConfig } from "../lib/db.js";
import { sendLog } from "../lib/sendLog.js";
import { logger } from "../lib/logger.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";

export async function handleGuildMemberAdd(member: GuildMember) {
  const config = await getGuildConfig(member.guild.id);

  // --- Welcome message ---
  if (config?.welcomeChannelId) {
    const channel = await member.guild.channels
      .fetch(config.welcomeChannelId)
      .catch(() => null);

    if (channel?.isTextBased()) {
      const raw = config.welcomeMessage ?? "Welcome to the server, {user}!";
      const text = raw
        .replace(/\{user\}/g, `<@${member.id}>`)
        .replace(/\{username\}/g, member.user.username)
        .replace(/\{server\}/g, member.guild.name)
        .replace(/\{count\}/g, String(member.guild.memberCount));

      try {
        if (config.welcomeBannerUrl) {
          // Build a canvas banner with the user's avatar and welcome text
          const canvas = createCanvas(900, 250);
          const ctx = canvas.getContext("2d");

          // Background
          const bg = await loadImage(config.welcomeBannerUrl).catch(() => null);
          if (bg) {
            ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
          } else {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, "#1a1a2e");
            gradient.addColorStop(1, "#16213e");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Overlay
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Avatar circle
          const avatarUrl =
            member.user.displayAvatarURL({ extension: "png", size: 128 });
          const avatar = await loadImage(avatarUrl).catch(() => null);
          const cx = 120;
          const cy = canvas.height / 2;
          const r = 80;

          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
          ctx.fillStyle = "#7289da";
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          if (avatar) ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
          ctx.restore();

          // Welcome text
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 28px sans-serif";
          ctx.fillText("Welcome to the server!", 230, 100);

          ctx.fillStyle = "#7289da";
          ctx.font = "bold 36px sans-serif";
          const displayName = member.user.username;
          ctx.fillText(displayName, 230, 148);

          ctx.fillStyle = "#aaaaaa";
          ctx.font = "20px sans-serif";
          ctx.fillText(`Member #${member.guild.memberCount}`, 230, 185);

          const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
            name: "welcome.png",
          });

          await channel.send({ content: text, files: [attachment] });
        } else {
          await channel.send({ content: text });
        }
      } catch (err) {
        logger.error({ err }, "Failed to send welcome message");
        await channel.send({ content: text }).catch(() => {});
      }
    }
  }

  // --- Auto Role ---
  if (config?.autoRoleId) {
    try {
      await member.roles.add(config.autoRoleId);
    } catch (err) {
      logger.error({ err, guildId: member.guild.id, roleId: config.autoRoleId }, "Failed to assign auto role");
    }
  }

  // --- Log ---
  await sendLog(
    member.guild,
    "#43b581",
    "✅ Member Joined",
    [
      { name: "User", value: `<@${member.id}> (${member.user.tag})`, inline: true },
      { name: "ID", value: member.id, inline: true },
      { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "Member Count", value: String(member.guild.memberCount), inline: true },
    ],
  );
}
