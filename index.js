const { 
  Client, 
  GatewayIntentBits, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  Events 
} = require('discord.js');

const OWNER_ROLE_ID = "1478554422303916185";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {

  // Slash command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'sendmessage') {

      // Role check
      if (!interaction.member.roles.cache.has(OWNER_ROLE_ID)) {
        return interaction.reply({
          content: "You don't have permission to use this command.",
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

  // Modal submit
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'sendMessageModal') {

      const message = interaction.fields.getTextInputValue('messageInput');

      await interaction.reply({
        content: "Message sent!",
        ephemeral: true
      });

      await interaction.channel.send(message);
    }
  }

});

client.login(process.env.TOKEN);
