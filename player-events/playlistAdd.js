module.exports = (bot, message, playlist) => {
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
    .setColor(bot.color)
    .setDescription(` ${playlist.title} a fost adăugat la coadă (**${playlist.items.length}** melodiei) !`)

    message.channel.send(embed);

};