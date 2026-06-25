import { type Message, type PartialMessage } from "discord.js";
import { sendLog } from "../lib/sendLog.js";

export async function handleMessageUpdate(
  oldMsg: Message | PartialMessage,
  newMsg: Message | PartialMessage,
) {
  if (!newMsg.guild) return;
  if (newMsg.author?.bot) return;
  if (oldMsg.content === newMsg.content) return;

  await sendLog(
    newMsg.guild,
    "#faa61a",
    "✏️ Message Edited",
    [
      {
        name: "Author",
        value: newMsg.author ? `<@${newMsg.author.id}> (${newMsg.author.tag})` : "Unknown",
        inline: true,
      },
      { name: "Channel", value: newMsg.channel.toString(), inline: true },
      {
        name: "Jump to Message",
        value: newMsg.url ?? "N/A",
        inline: true,
      },
      {
        name: "Before",
        value: (oldMsg.content ?? "*(unknown)*").slice(0, 1020),
      },
      {
        name: "After",
        value: (newMsg.content ?? "*(empty)*").slice(0, 1020),
      },
    ],
  );
}
