module.exports = (bot, message, query, tracks) => {

    const { MessageEmbed } = require('discord.js')
    const embed = new   MessageEmbed()
    .setColor(bot.color)
    .setDescription(' Nu ați furnizat un răspuns valid ... Vă rugăm să trimiteți din nou comanda. ')

    message.channel.send(embed);

};