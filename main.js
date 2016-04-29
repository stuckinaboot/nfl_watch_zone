$(function () {
    window.gridHandler = GridHandler;
    window.playerHandler = PlayerHandler;
    window.playerHandler(playersLoaded);

    window.gameHandler = GameHandler;
    window.gameHandler.initialize();

    window.cookieHandler = CookieHandler;

    var playerMap = {};
    var playerNameList = [];
    var playersInactiveThisWeek = [];

    function playersLoaded (map) {
        playerMap = map;
        initializeTypeahead();
        setTimeout(addSavedPlayers, 500);
        beginUpdating();
    };
    var url = 'http://www.nfl.com/liveupdate/game-center/2012080953/2012080953_gtd.json';
    
    var statFields = ['passing','rushing','receiving','kicking','defense'];
    var checkboxColumn = {
        cell: 'select-row',
        headerCell: 'select-all',
    };
    var nameColumn = {
        name: 'name',
        label: 'name',
        editable: false,
        cell: 'string'
    };
    var posColumn = {
        name: 'pos',
        label: 'pos',
        editable: false,
        cell: 'string'
    };
    var teamColumn = {
        name: 'team',
        label: 'team',
        editable: false,
        cell: 'string'
    };

    var collections = {};
    var grids = {};

    var onSuccess = function (data, status, jqXHR) {
        statFields.forEach(function (stat) {
            var columns = [checkboxColumn, nameColumn, posColumn, teamColumn];
            var collection = new PlayerCollection();
            var statData = data['2012080953']['home']['stats'][stat];
            $.each(statData, function (k, v) {
                var contents = {};
                $.each(statData[k], function (k2, v2) {
                    contents[k2] = v2;
                });
                $.each(contents, function (k, v) {
                    if (k !== 'name') {
                        columns.push({
                            name: k,
                            label: k,
                            editable: false,
                            cell: 'integer'
                        });
                    }
                });
                return false;
            });
            collections[stat] = collection;
            grids[stat] = window.gridHandler(columns, collection, stat + '-grid');
        });
    };

    function addSavedPlayers() {
        playerNameListJSON = window.cookieHandler.getFromCookie('playerNameList');
        if (typeof playerNameListJSON !== 'undefined') {
            playerNameList = playerNameListJSON['playerNameList'];
            $.each(playerNameList, function (i, name) {
                addPlayer(name, false, false);
            });
        }
    };

    function initializeTypeahead() {
        var keys = Object.keys(playerMap);
        keys.push('95-96 Bulls');
        keys.push('Brian Scalabrine');
        keys.push('Ian Sibner');
        $.typeahead({
            input: '.player-search',
            order: 'desc',
            source: {
                data: keys
            },
            callback: {
                onInit: function (node) {
                    
                }
            }
        });
    };
    $('#btn-player-search').on('click', function () {
        var playerTxt = $('#input-player-search').val();
        addPlayer(playerTxt, true, true);
    });
    var addPlayer = function (playerTxt, shouldSaveInCookie, shouldDisplayAlert) {
        if ($.inArray(playerTxt, Object.keys(playerMap)) > -1) {
            //Player was found in the player array
            var playerTxtComponents = playerTxt.split(' ');
            var playerNameStr = playerTxtComponents[0].substring(0, 1) 
                                + '.' + playerTxtComponents[1];
            var model = new window.PlayerModel({
                    name: playerNameStr,
                    full_name: playerTxt
                });
            var gameInfo = window.gameHandler.getGameInfo(playerMap[playerTxt]['team']);
            model.set({
                gameID: gameInfo['gameID'],
                stance: gameInfo['stance']
            });
            function obtainInfoCallback (gameDetailedInfo) {
                //Find the right model in the info
                var foundPlayer = false;
                var playerObj = undefined;
                var keyFoundAt = '';
                var foundStance = '';
                var stances = ['home', 'away'];
                $.each(stances, function (a, stance) {
                    $.each(gameDetailedInfo[stance], function (key, val) {
                        $.each(gameDetailedInfo[stance][key], function (i, player) {
                            if (player['name'] === playerNameStr) {
                                foundPlayer = true;
                                playerObj = player;
                                keyFoundAt = key;
                                foundStance = stance;
                                return false;
                            }
                        });
                        if (foundPlayer) {
                            return false;
                        }
                    });
                });
                if (foundPlayer) {
                    //Check if model exist in collection
                    var existingModel = collections[keyFoundAt].find(function (m) {
                        return m.get('name') === model.get('name');
                    });

                    if (typeof existingModel !== 'undefined') {
                        model = existingModel;
                    }
                    //Add stats to the player model
                    var team = (foundStance === 'home') ? gameDetailedInfo['home_abbr'] : gameDetailedInfo['away_abbr'] 
                    model.set({
                        team: team,
                        pos: playerMap[playerTxt]['pos']
                    });
                    model.set(playerObj);
                    collections[keyFoundAt].add(model);
                    if ($.inArray(playerTxt, playerNameList) == -1) {
                        playerNameList.push(playerTxt);
                    }
                    
                    if (shouldSaveInCookie) {
                        savePlayerNameListToCookie();
                    }
                    if (shouldDisplayAlert) {
                        alertify.success('Success: Player added succesfully');
                    }
                } else {
                    if (shouldDisplayAlert) {
                        alertify.log('Player added but is not active this week');
                    }
                    if ($.inArray(playerTxt, playerNameList) == -1) {
                        playerNameList.push(playerTxt);
                    }
                    if (shouldSaveInCookie) {
                        savePlayerNameListToCookie();
                    }
                    if ($.inArray(playerTxt, playersInactiveThisWeek) == -1) {
                        playersInactiveThisWeek.push(playerTxt);
                        updateInactivePlayersParagraph();
                    }
                }
            };
            window.gameHandler.obtainInfoDetailed(gameInfo['gameID'], obtainInfoCallback);
        } else {
            alertify.error('Error: Could not find player');
        }
    }

    function savePlayerNameListToCookie() {
        window.cookieHandler.saveInCookie('playerNameList', {playerNameList: playerNameList});
    }

    function beginUpdating() {
        setInterval(updatePlayers, 1000);
    }

    function updateInactivePlayersParagraph() {
        $('#p-inactive-players').text(playersInactiveThisWeek.join(', '));
    }

    function updatePlayers() {
        $.each(collections, function (i, collection) {
            collection.each(function (model) {
                addPlayer(model.get('full_name'), true, false);
            });
        });
    }

    $('#btn-delete-selected').on('click', function () {
        statFields.forEach(function (stat) {
            var modelsToDelete = grids[stat].getSelectedModels();
            $.each(modelsToDelete, function (i, model) {
                playerNameList = $.grep(playerNameList, function (val) {
                    return val != model.get('full_name');
                });
                model.destroy();
            });
        });
        savePlayerNameListToCookie();
    });

    $.ajax({
        dataType: 'json',
        url: url,
        success: onSuccess
    });

});