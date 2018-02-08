/*
 * achievementsTracker.js
 * 1.0.0 (2018-02-08)
 *
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 * https://github.com/joelcancela/SteamAchievementCompletionist
 *
 * Copyright 2018 Joël CANCELA VAZ[joel.cancelavaz@gmail.com]
 * This is not affiliated with Steam (owned by Valve)
 */

/************************************************** Globals **************************************************/
// Fields
var steamID;//Steam64ID of the User
var gamesWithAchievementsOwned;//JSON containing the games/apps owned
var welcomeModalDisplay;//Variable defining if the welcome modal should be hidden at startup
// Stats
var completion_sum = 0;
var achievements_sum = 0;
var games_completed = 0;
var blacklisted_games = [247750]; //Games does still count in the achievements but are not in the array (demos like The Stanley Parable Demo)
// API Related
var apiKey;//TODO user can provide Steam API
var CORS_STEAM_ACHIEVEMENTS_URL = "https://www.joelcancela.fr/services/sac/getSteamAchievements/";

/************************************************** Initialization  **************************************************/

/**
 * Retrieves the preferences from the local storage, initializes the events and the table.
 */
$(document).ready(function () {
    initializeEvents();
    welcomeModalDisplay = localStorage.getItem('welcomeModal');
    if (welcomeModalDisplay == null) {
        $('#welcomeModal').modal('show');
    }
    initializeTable();
    steamID = localStorage.getItem('steamid');
    gamesWithAchievementsOwned = localStorage.getItem('games');
    if (steamID !== null && gamesWithAchievementsOwned !== null) {
        $("#steamid").val(JSON.parse(steamID));
        $("#gamesJSON").val(gamesWithAchievementsOwned);
    }
});

/************************************************** Tablesorter **************************************************/

/**
 * Initializes the tablesorter plugin.
 */
function initializeTable() {
    $(function () {
        $.tablesorter.themes.bootstrap = {
            table: 'table table-bordered table-striped',
            caption: 'caption',
            header: 'bootstrap-header',
            sortNone: '',
            sortAsc: '',
            sortDesc: '',
            active: '',
            hover: '',
            icons: '',
            iconSortNone: 'bootstrap-icon-unsorted',
            iconSortAsc: 'glyphicon glyphicon-chevron-up',
            iconSortDesc: 'glyphicon glyphicon-chevron-down',
            filterRow: '',
            footerRow: '',
            footerCells: '',
            even: '',
            odd: ''
        };

        $("#achievements_table").tablesorter({
            theme: "grey",
            widthFixed: true,
            headerTemplate: '{content} {icon}',
            sortList: [[0, 0]],
            widgets: ["uitheme", "filter", "columns", "zebra"],
            widgetOptions: {
                zebra: ["even", "odd"],
                columns: ["primary", "secondary", "tertiary"],
                filter_reset: ".reset",
                filter_cssFilter: "form-control",
                filter_functions: {
                    2: {
                        /**
                         * Filter function to hide fully completed games/apps.
                         * @return {boolean} true if the game is not 100% completed
                         */
                        'Hide 100% games': function (e, n) {
                            return n < 100;
                        }
                    }
                }
            }
        })
    });
}

/************************************************** Local Storage Manipulation **************************************************/

/**
 * Initializes events like :
 * Checkbox event to remember user preference about hiding the welcome modal.
 * Saves to the local storage, the Steam64ID and the JSON of owned games when submitting.
 */
function initializeEvents() {
    $("#welcomeModalCheckbox").change(function () {
        if (this.checked) {
            localStorage.setItem('welcomeModal', "false");
        } else {
            localStorage.setItem('welcomeModal', null);
        }

    });
    $('#userInfo').on('submit', function (e) {
        e.preventDefault();
        steamID = $('#steamid').val();
        gamesWithAchievementsOwned = JSON.parse($('#gamesJSON').val());
        $('#number_games').html("/" + gamesWithAchievementsOwned.length);
        localStorage.setItem('steamid', JSON.stringify(steamID));
        localStorage.setItem('games', JSON.stringify(gamesWithAchievementsOwned));
        retrieveAchievementsInfo(gamesWithAchievementsOwned);
        retrieveBlacklistedGamesAchievements();
        return false;
    });
}

/************************************************** Steam API Calls  **************************************************/

/**
 * Retrieves the achievements for a game.
 * @param appid the appid of the game or app
 * @param isBlacklisted boolean that indicates if the game or app is blacklisted (not shown on Steam showcases stats)
 */
function getGameAchievements(appid, isBlacklisted) {
    $.getJSON(URLAchievementsBuilder(appid, apiKey, steamID), function (data) {
        appendGameToTable(data, appid, isBlacklisted);
    }).fail(function (request, error) {
        console.log(" Can't do because: " + error);
    });
}

/**
 * Retrieves the achievements for the blacklisted games
 */
function retrieveBlacklistedGamesAchievements() {
    var appid;
    for (var index in blacklisted_games) {
        appid = blacklisted_games[index];
        getGameAchievements(appid, true);
    }
}

/**
 * Retrieve the achievements for the games.
 * @param games the array of the games
 */
function retrieveAchievementsInfo(games) {
    $('#results').removeClass("hidden");
    for (var i in games) {
        if (games.hasOwnProperty(i) && games[i].hasOwnProperty('appid')) {
            getGameAchievements(games[i]['appid'], false);
        }
    }
}

/**
 * Creates URL for to retrieve the achievements info for a game or app.
 * @param appid the appid of the game or app
 * @param key the Steam Web API Key used
 * @param steamID the STEAM64 ID of the user
 * @return {string} the URL for the game or app asked
 */
function URLAchievementsBuilder(appid, key, steamID) {
    return CORS_STEAM_ACHIEVEMENTS_URL + "?appid=" + appid + "&steam_key_api=" + key + "&steamid=" + steamID;
}

/************************************************** DOM Manipulation  **************************************************/

/**
 * Calculates the stats for a game and triggers the table refresh.
 * @param json the game or app json
 * @param appid the appid of the game or app
 * @param isBlacklisted boolean that indicates if the game or app is blacklisted (not shown on Steam showcases stats)
 */
function appendGameToTable(json, appid, isBlacklisted) {
    var game_name = json['playerstats']['gameName'];
    var number_of_achievements = json['playerstats']['achievements'].length;
    var number_of_achievements_achieved = 0;
    for (var i in json['playerstats']['achievements']) {
        if (json['playerstats']['achievements'].hasOwnProperty(i) && json['playerstats']['achievements'][i]['achieved'] === 1)
            number_of_achievements_achieved++;
    }
    var game_completion = Math.floor(((number_of_achievements_achieved / number_of_achievements) * 100));
    if (game_completion === 100) games_completed++;
    achievements_sum += number_of_achievements_achieved;
    completion_sum += (number_of_achievements_achieved / number_of_achievements) * 100;
    $('#games_table').append(row_builder(game_name, appid, game_completion, isBlacklisted));
    var resort = true;
    $("table").trigger("update", [resort, updateStats(isBlacklisted)]);
}

/**
 * Appends a new row on the table for a game or app with a gradient color depending on the completion (gradient from red to green).
 * @param game_name the name of the game or app
 * @param appid the appid of the game or app
 * @param game_completion the percentage of completion for the game or app
 * @param isBlacklisted boolean that indicates if the game or app is blacklisted (not shown on Steam showcases stats)
 * @returns {string} the DOM string to append to the table
 */
function row_builder(game_name, appid, game_completion, isBlacklisted) {
    var dom;
    if (isBlacklisted) {
        dom = "<tr><td><span class='blacklisted'>" + game_name + "</span></td><td>" + appid + "</td>";
    } else {
        dom = "<tr><td>" + game_name + "</td><td>" + appid + "</td>";
    }
    dom += "<td class='gradient_" + Math.floor(game_completion / 2) + " '>" + game_completion + "</td></tr>";
    return dom;
}

/**
 * Updates the stats for a new game/app.
 * @param isBlacklisted boolean that indicates if the game or app is blacklisted (not shown on Steam showcases stats)
 */
var updateStats = function (isBlacklisted) {
    var blacklistedGamesSpan = $('#blacklisted_games_span');
    var blacklistedGamesRetrieved = $('#blacklisted_games_retrieved');
    var gamesRetrieved = $('#number_games_retrieved');
    if (isBlacklisted) {
        blacklistedGamesSpan.show();
        var numberOfBlacklistedGamesRetrieved = parseInt(blacklistedGamesRetrieved.text()) + 1;
        blacklistedGamesRetrieved.html(numberOfBlacklistedGamesRetrieved);
    } else {
        var numberOfGamesRetrieved = parseInt(gamesRetrieved.text()) + 1;
        gamesRetrieved.html(numberOfGamesRetrieved);
    }
    var average_completion = $('#average_completion');
    average_completion.html(Math.floor(completion_sum / (parseInt(gamesRetrieved.text()) + parseInt(blacklistedGamesRetrieved.text()))));
    var achievements_nb = $('#achievements_number');
    achievements_nb.html(achievements_sum);
    var games_completed_nb = $('#games_completed');
    games_completed_nb.html(games_completed);
};