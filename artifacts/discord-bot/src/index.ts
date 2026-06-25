import {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
} from "discord.js";
import { logger } from "./lib/logger.js";
import { handleGuildMemberAdd } from "./events/guildMemberAdd.js";
import { handleMessageDelete } from "./events/messageDelete.js";
import { handleMessageUpdate } from "./events/messageUpdate.js";
import { handleGuildMemberRemove } from "./events/guildMemberRemove.js";
import { handleGuildBanAdd } from "./events/guildBanAdd.js";
import { handleGuildBanRemove } from "./events/guildBanRemove.js";
import { handleGuildMemberUpdate } from "./events/guildMemberUpdate.js";
import { handleVoiceStateUpdate } from "./events/voiceStateUpdate.js";
import { handleChannelCreate } from "./events/channelCreate.js";
import { handleChannelDelete } from "./events/channelDelete.js";
import { handleRoleCreate } from "./events/roleCreate.js";
import { handleRoleDelete } from "./events/roleDelete.js";
import { handleInteractionCreate } from "./events/interactionCreate.js";
import { commands } from "./commands/index.js";

const token = process.env["DISCORD_TOKEN"];
if (!token) {
  logger.error("DISCORD_TOKEN environment variable is required");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.once("ready", async (c) => {
  logger.info({ tag: c.user.tag }, "Bot logged in");

  const rest = new REST().setToken(token!);
  const commandData = commands.map((cmd) => cmd.data.toJSON());

  try {
    await rest.put(Routes.applicationCommands(c.user.id), { body: commandData });
    logger.info({ count: commandData.length }, "Registered global slash commands");
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
  }
});

client.on("guildMemberAdd", (member) => handleGuildMemberAdd(member));
client.on("guildMemberRemove", (member) => handleGuildMemberRemove(member));
client.on("guildBanAdd", (ban) => handleGuildBanAdd(ban));
client.on("guildBanRemove", (ban) => handleGuildBanRemove(ban));
client.on("guildMemberUpdate", (oldMember, newMember) => handleGuildMemberUpdate(oldMember, newMember));
client.on("messageDelete", (message) => handleMessageDelete(message));
client.on("messageUpdate", (oldMsg, newMsg) => handleMessageUpdate(oldMsg, newMsg));
client.on("voiceStateUpdate", (oldState, newState) => handleVoiceStateUpdate(oldState, newState));
client.on("channelCreate", (channel) => handleChannelCreate(channel));
client.on("channelDelete", (channel) => handleChannelDelete(channel));
client.on("roleCreate", (role) => handleRoleCreate(role));
client.on("roleDelete", (role) => handleRoleDelete(role));
client.on("interactionCreate", (interaction) => handleInteractionCreate(interaction));

client.on("error", (err) => logger.error({ err }, "Discord client error"));
client.on("warn", (msg) => logger.warn({ msg }, "Discord client warning"));

client.login(token);
