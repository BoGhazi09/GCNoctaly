const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require("discord.js");
const express = require("express");

// ====== KEEP RENDER ALIVE ======
const app = express();
app.get("/", (req, res) => res.send("Bot is alive"));
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// ====== CONFIG ======
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const OWNER_ROLE_ID = "1478554422303916185";

// ====== DISCORD CLIENT ======
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ====== SLASH COMMAND ======
const commands = [
  new SlashCommandBuilder()
    .setName("sendmessage")
    .setDescription("Send a custom embed message")
    .addStringOption(option =>
      option.setName("message")
        .setDescription("Message to send")
        .setRequired(true)
    )
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
      console.log("Missing env variables");
      return;
    }

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Slash command registered");
  } catch (err) {
    console.log("Command register error:", err);
  }
})();

// ====== READY ======
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ====== COMMAND HANDLER ======
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "sendmessage") {
    try {
      const hasRole = interaction.member.roles.cache.has(OWNER_ROLE_ID);

      if (!hasRole) {
        return interaction.reply({
          content: "No permission.",
          ephemeral: true,
        });
      }

      const msg = interaction.options.getString("message");

      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setDescription(msg)
        .setFooter({ text: `Sent by ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({ content: "Sent.", ephemeral: true });
      await interaction.channel.send({ embeds: [embed] });

    } catch (err) {
      console.log("Command error:", err);
    }
  }
});

client.login(TOKEN);
