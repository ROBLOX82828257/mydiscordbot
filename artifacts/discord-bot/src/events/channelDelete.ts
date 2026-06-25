import { type DMChannel, type NonThreadGuildBasedChannel } from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export async function handleChannelDelete(channel: DMChannel | NonThreadGuildBasedChannel) {
  if (channel.isDMBased()) return;

  await sendLog(
    channel.guild,
    "#f04747",
    "🗑️ Channel Deleted",
    [
      { name: "Name", value: channel.name, inline: true },
      { name: "Type", value: String(channel.type), inline: true },
      { name: "ID", value: channel.id, inline: true },
    ],
  );
}
