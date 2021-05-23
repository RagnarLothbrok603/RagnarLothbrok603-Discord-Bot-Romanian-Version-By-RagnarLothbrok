module.exports = (bot, error, message) => {

    switch (error) {
        case 'NotPlaying':
            message.channel.send('Nu este redată nicio muzică pe acest server !');
            break;
        case 'NotConnected':
            message.channel.send('  Nu sunteți conectat în niciun canal vocal !');
            break;
        case 'UnableToJoin':
            message.channel.send(' Nu pot să mă alătur canalului dvs. vocal, vă rugăm să verificați permisiunile mele !');
            break;
        default:
            message.channel.send(' Ceva n-a mers bine ... Eroare : ${error}');
    };

};
