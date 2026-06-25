import * as welcome from "./welcome.js";
import * as logs from "./logs.js";
import type { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands: Command[] = [
  { data: welcome.data as SlashCommandBuilder, execute: welcome.execute },
  { data: logs.data as SlashCommandBuilder, execute: logs.execute },
];
