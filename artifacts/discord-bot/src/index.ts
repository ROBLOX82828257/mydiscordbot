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

// ── Process-level safety net ──────────────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection — bot stays alive");
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception — bot stays alive");
});

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

// ── Helper: wrap async event handlers so errors never go unhandled ────────────
function safe<T extends unknown[]>(
  name: string,
  fn: (...args: T) => Promise<void>,
): (...args: T) => void {
  return (...args: T) => {
    fn(...args).catch((err) => logger.error({ err }, `Error in ${name}`));
  };
}

client.once("clientReady", async (c) => {
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

client.on("guildMemberAdd",    safe("guildMemberAdd",    (m) => handleGuildMemberAdd(m)));
client.on("guildMemberRemove", safe("guildMemberRemove", (m) => handleGuildMemberRemove(m)));
client.on("guildBanAdd",       safe("guildBanAdd",       (b) => handleGuildBanAdd(b)));
client.on("guildBanRemove",    safe("guildBanRemove",    (b) => handleGuildBanRemove(b)));
client.on("guildMemberUpdate", safe("guildMemberUpdate", (o, n) => handleGuildMemberUpdate(o, n)));
client.on("messageDelete",     safe("messageDelete",     (m) => handleMessageDelete(m)));
client.on("messageUpdate",     safe("messageUpdate",     (o, n) => handleMessageUpdate(o, n)));
client.on("voiceStateUpdate",  safe("voiceStateUpdate",  (o, n) => handleVoiceStateUpdate(o, n)));
client.on("channelCreate",     safe("channelCreate",     (c) => handleChannelCreate(c)));
client.on("channelDelete",     safe("channelDelete",     (c) => handleChannelDelete(c)));
client.on("roleCreate",        safe("roleCreate",        (r) => handleRoleCreate(r)));
client.on("roleDelete",        safe("roleDelete",        (r) => handleRoleDelete(r)));
client.on("interactionCreate", safe("interactionCreate", (i) => handleInteractionCreate(i)));

client.on("error", (err) => logger.error({ err }, "Discord client error"));
client.on("warn",  (msg) => logger.warn({ msg },  "Discord client warning"));

// ── Reconnect on disconnect ───────────────────────────────────────────────────
client.on("shardDisconnect", (event, id) => {
  logger.warn({ code: event.code, id }, "Shard disconnected — discord.js will auto-reconnect");
});

client.login(token);
