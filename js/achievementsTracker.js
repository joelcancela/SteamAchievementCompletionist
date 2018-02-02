/*
 * achievementsTracker.js
 * 1.0.0 (2017-12-02)
 *
 *
 * Copyright 2017 Joël CANCELA VAZ[joel.cancelavaz@gmail.com]
 * This is not affiliated with Steam (owned by Valve)
 */

/**
 * Globals
 */
var steamID;
var gamesWithAchievementsOwned;
var welcomeModalDisplay;
var completion_sum = 0;
var achievements_sum = 0;
var games_completed = 0;
var apiKey;//TODO user can provide Steam API
var CORS_STEAM_ACHIEVEMENTS_URL = "http://www.joelcancela.fr/services/sac/getSteamAchievements/";
var blacklisted_games = [247750]; //Games does still count in the achievements but are not in the array (demos like The Stanley Parable Demo)

/**
 * Init
 */
$(document).ready(function () {
    $("#welcomeModalCheckbox").change(function () {
        if (this.checked) {
            localStorage.setItem('welcomeModal', "false");
        } else {
            localStorage.setItem('welcomeModal', null);
        }

    });
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

/**
 * Functions
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
                         * Filter function
                         * @return {boolean}
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

var updateNumberOfGamesRetrieved_and_averageCompletion = function (isBlacklisted) {
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

$('#userInfo').on('submit', function (e) {
    e.preventDefault();
    steamID = $('#steamid').val();
    gamesWithAchievementsOwned = JSON.parse($('#gamesJSON').val());
    $('#number_games').html("/" + gamesWithAchievementsOwned.length);
    localStorage.setItem('steamid', JSON.stringify(steamID));
    localStorage.setItem('games', JSON.stringify(gamesWithAchievementsOwned));
    retrieveAchievementsInfo(gamesWithAchievementsOwned);
    addBlacklistedGames();
    return false;
});

function asyncCalls(appid) {
    $.getJSON(URLAchievementsBuilder(appid, apiKey, steamID), function (data) {
        appendGameToTable(data, appid, false);
    }).fail(function (request, error) {
        console.log(" Can't do because: " + error);
    });
}

function addBlacklistedGames() {
    var appid;
    for (var index in blacklisted_games) {
        appid = blacklisted_games[index];
        $.getJSON(URLAchievementsBuilder(appid, apiKey, steamID), function (data) {
            // noinspection JSReferencingMutableVariableFromClosure
            appendGameToTable(data, appid, true);
        }).fail(function (request, error) {
            console.log(" Can't do because: " + error);
        });
    }
}

function retrieveAchievementsInfo(games) {
    $('#results').removeClass("hidden");
    for (var i in games) {
        // noinspection JSUnfilteredForInLoop
        if (games[i].hasOwnProperty('appid')) {
            // noinspection JSUnfilteredForInLoop
            asyncCalls(games[i]['appid']);
        }
    }

}

/**
 * Creates URL for achievements info
 * @return {string}
 */
function URLAchievementsBuilder(appid, key, steamID) {
    return CORS_STEAM_ACHIEVEMENTS_URL + "?appid=" + appid + "&steam_key_api=" + key + "&steamid=" + steamID;
}

function appendGameToTable(json, appid, isBlacklisted) {
    var game_name = json['playerstats']['gameName'];
    var number_of_achievements = json['playerstats']['achievements'].length;
    var number_of_achievements_achieved = 0;
    for (var i in json['playerstats']['achievements']) {
        // noinspection JSUnfilteredForInLoop
        if (json['playerstats']['achievements'][i]['achieved'] === 1)
            number_of_achievements_achieved++;
    }
    var game_completion = Math.floor(((number_of_achievements_achieved / number_of_achievements) * 100));
    if (game_completion === 100) games_completed++;
    achievements_sum += number_of_achievements_achieved;
    completion_sum += (number_of_achievements_achieved / number_of_achievements) * 100;
    $('#games_table').append(row_builder(game_name, appid, game_completion, isBlacklisted));
    var resort = true;
    $("table").trigger("update", [resort, updateNumberOfGamesRetrieved_and_averageCompletion(isBlacklisted)]);
}

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