import { EmbedBuilder, type ColorResolvable, type Guild } from "discord.js";
import { getGuildConfig } from "./db.js";
import { logger } from "./logger.js";

export async function sendLog(
  guild: Guild,
  color: ColorResolvable,
  title: string,
  fields: { name: string; value: string; inline?: boolean }[],
  description?: string,
) {
  try {
    const config = await getGuildConfig(guild.id);
    if (!config?.logChannelId) return;

    const channel = await guild.channels.fetch(config.logChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setTimestamp();

    if (description) embed.setDescription(description);
    if (fields.length > 0) embed.addFields(fields);

    await channel.send({ embeds: [embed] });
  } catch (err) {
    logger.error({ err, guildId: guild.id, title }, "Failed to send log");
  }
}
