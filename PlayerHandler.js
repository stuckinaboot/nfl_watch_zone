$(function () {
    var obtainPlayerData = function (callback) {
        // var file = "http://m.uploadedit.com/ba3s/1461090565504.txt";
        var file = './nfl-players2.txt';
        playerMap = {};
        $.ajax({
            url: file,
            type: 'GET',
            dataType: 'jsonp',
            jsonpCallback: 'callback',
            async: true,
            success: function (data) { 
                var allPlayersJSON = data;

                $.each(allPlayersJSON['list'], function (index, player) {
                    playerMap[player['player']] = 
                    {
                        pos: player['pos'],
                        team: player['team'],
                    };
                });

                callback (playerMap);
            },
            error: function () { 
                alertify.error('Failed loading players'); 
            },
        });
    };
    window.PlayerHandler = obtainPlayerData;
});