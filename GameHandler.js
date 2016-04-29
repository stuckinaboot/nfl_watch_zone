$(function () {
    var DEV_MODE_ON = false;
    var DEV_MODE_MAX_JSON_NUM = 1003;
    //First obtain the scoreStrip and parse it into an easily-readable object
    var scoreStripURL = 'http://www.nfl.com/ajax/scorestrip?season=2015&seasonType=REG&week=15';
    var games = [];
    var initialize = function () {
        $.ajax({
            url: scoreStripURL,
            dataType: 'xml',
            success: function (xmlResponse) {
                var scoreStripJSON = $.xml2json(xmlResponse);
                var gamesList = scoreStripJSON['#document']['ss']['gms']['g'];
                $.each(gamesList, function (i, game) {
                    var contents = game['$'];
                    gameSimplified = {
                        gameID: contents['eid'],
                        home: contents['h'],
                        away: contents['v'],
                        score_home: contents['hs'],
                        score_away: contents['vs']
                    };
                    games.push(gameSimplified);
                });
            }
        });
    }

    var getGameInfo = function (teamName) {
        var gameToReturn = undefined;
        $.each(games, function (i, game) {
            if (game['home'] === teamName) {
                gameToReturn = {
                    gameID: game['gameID'],
                    stance: 'home'
                };
                return false;
            } else if (game['away'] === teamName) {
                gameToReturn = {
                    gameID: game['gameID'],
                    stance: 'away'
                };
                return false;
            }
        })

        return gameToReturn;
    };

    var obtainInfoDetailed = function (gameID, callback) {
        var url = 'http://www.nfl.com/liveupdate/game-center/' + gameID + '/' + gameID + '_gtd.json';

        if (DEV_MODE_ON) {
            if (typeof jsonNum === 'undefined') {
                jsonNum = 1;
            }
            url = './eagles_test/games/' + jsonNum.toString() + '.json';
            if (jsonNum + 1 <= DEV_MODE_MAX_JSON_NUM) {
                jsonNum++;
            }
        }
        function onSuccess (data, status, jqXHR) {
            var statFields = ['passing','rushing','receiving','kicking','defense'];
            var simplifiedGameData = {};
            simplifiedGameData['home'] = {};
            simplifiedGameData['away'] = {};
            $.each(statFields, function (i, field) {
                simplifiedGameData['home'][field] = [];

                simplifiedGameData['away'][field] = [];
            });
            simplifiedGameData['home_abbr'] = data[gameID]['home']['abbr'];
            simplifiedGameData['away_abbr'] = data[gameID]['away']['abbr'];

            statFields.forEach(function (stat) {
                var statDataHome = data[gameID]['home']['stats'][stat];
                $.each(statDataHome, function (k, v) {
                    var contents = {};
                    $.each(statDataHome[k], function (k2, v2) {
                        contents[k2] = v2;
                    });
                    simplifiedGameData['home'][stat].push(contents);
                });

                var statDataAway = data[gameID]['away']['stats'][stat];
                $.each(statDataAway, function (k, v) {
                    var contents = {};
                    $.each(statDataAway[k], function (k2, v2) {
                        contents[k2] = v2;
                    });
                    simplifiedGameData['away'][stat].push(contents);
                });
            });

            /*
             * Passes a map (containing 5 keys: passing, rushing, kicking
             * receiving, defense that each correspond to a list of players)
             * into the callback function
             */
             callback(simplifiedGameData);
        }
        $.ajax({
            dataType: 'json',
            url: url,
            data: {},
            success: onSuccess
        });
    
    };

    window.GameHandler = this;
    window.GameHandler.initialize = initialize;
    window.GameHandler.getGameInfo = getGameInfo;
    window.GameHandler.obtainInfoDetailed = obtainInfoDetailed;
});
