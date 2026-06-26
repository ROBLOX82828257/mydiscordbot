import * as welcome from "./welcome.js";
import * as logs from "./logs.js";
import * as autorole from "./autorole.js";
import * as moderation from "./moderation.js";
import * as channel from "./channel.js";
import * as admin from "./admin.js";
import * as badwords from "./badwords.js";
import type { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands: Command[] = [
  { data: welcome.data as SlashCommandBuilder, execute: welcome.execute },
  { data: logs.data as SlashCommandBuilder, execute: logs.execute },
  { data: autorole.data as SlashCommandBuilder, execute: autorole.execute },
  { data: moderation.data as SlashCommandBuilder, execute: moderation.execute },
  { data: channel.data as SlashCommandBuilder, execute: channel.execute },
  { data: admin.data as SlashCommandBuilder, execute: admin.execute },
  { data: badwords.data as SlashCommandBuilder, execute: badwords.execute },
];
