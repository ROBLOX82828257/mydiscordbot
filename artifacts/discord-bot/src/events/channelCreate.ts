import { type NonThreadGuildBasedChannel } from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export async function handleChannelCreate(channel: NonThreadGuildBasedChannel) {
  await sendLog(
    channel.guild,
    "#43b581",
    "📁 Channel Created",
    [
      { name: "Name", value: channel.name, inline: true },
      { name: "Type", value: String(channel.type), inline: true },
      { name: "ID", value: channel.id, inline: true },
    ],
  );
}
