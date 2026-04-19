const { 
  Client, 
  GatewayIntentBits, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  Events,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const OWNER_ROLE_ID = "1478554422303916185";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ✅ Register command when bot starts
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('sendmessage')
      .setDescription('Send a message using the bot')
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Slash command registered");
  } catch (err) {
    console.error(err);
  }
});

// تعاملات
client.on(Events.InteractionCreate, async (interaction) => {

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'sendmessage') {

      if (!interaction.member.roles.cache.has(OWNER_ROLE_ID)) {
        return interaction.reply({
          content: "No permission.",
          ephemeral: true
        });
      }

      const modal = new ModalBuilder()
        .setCustomId('sendMessageModal')
        .setTitle('Send a Message');

      const input = new TextInputBuilder()
        .setCustomId('messageInput')
        .setLabel('Enter your message')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);

      await interaction.showModal(modal);
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'sendMessageModal') {

      const message = interaction.fields.getTextInputValue('messageInput');

      await interaction.reply({
        content: "Sent!",
        ephemeral: true
      });

      await interaction.channel.send(message);
    }
  }

});

client.login(process.env.TOKEN);
