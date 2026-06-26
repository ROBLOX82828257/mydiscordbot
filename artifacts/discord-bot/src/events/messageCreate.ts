import { type Message, EmbedBuilder } from "discord.js";
import { getGuildConfig } from "../lib/db.js";
import { sendLog } from "../lib/sendLog.js";
import { logger } from "../lib/logger.js";

function getList(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}

export async function handleMessageCreate(message: Message) {
  if (message.author.bot || !message.guild) return;

  const config = await getGuildConfig(message.guild.id);
  if (!config?.badWordsEnabled) return;

  const list = getList(config.badWordsList);
  if (list.length === 0) return;

  const content = message.content.toLowerCase();
  const matched = list.find((word) => {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return regex.test(content);
  });

  if (!matched) return;

  try {
    await message.delete();
  } catch (err) {
    logger.warn({ err }, "Could not delete bad word message");
    return;
  }

  // Warn the user via DM
  try {
    await message.author.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#f04747")
          .setTitle("⚠️ Message Removed")
          .setDescription(`Your message in **${message.guild.name}** was removed because it contained a blocked word.`)
          .setTimestamp(),
      ],
    });
  } catch {
    // DMs might be disabled — that's fine
  }

  // Log to log channel
  await sendLog(
    message.guild,
    "#f04747",
    "🚫 Bad Word Detected",
    [
      { name: "User", value: `<@${message.author.id}> (${message.author.tag})`, inline: true },
      { name: "Channel", value: `<#${message.channelId}>`, inline: true },
      { name: "Matched Word", value: `\`${matched}\``, inline: true },
      { name: "Message", value: message.content.slice(0, 1024) || "(empty)" },
    ],
  );
}
