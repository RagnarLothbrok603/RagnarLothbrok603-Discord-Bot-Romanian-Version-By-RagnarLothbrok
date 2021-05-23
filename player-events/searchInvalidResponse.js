module.exports = (bot, message, query, tracks, content, collector) => {

    message.channel.send(' - Trebuie să trimiteți un număr valid între **1** si **${tracks.length}** !');

};