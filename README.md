# S.A.C. (SteamAchievementCompletionist)

This project provides a simple view of the achievement completion for every game owned by a user on his Steam account.

## Preview
![Preview](img/preview.png)

You can try it here: [sac.joelcancela.fr](http://sac.joelcancela.fr/)

## Requirements

* You need to have a Steam account.
* You need to be at least level **10**.

## How to use

* Get your STEAM64 ID and copy-paste it in the field **Steam64 ID**
* Go to your Steam profile and click on **Edit profile**
* Open console (F12) and type :
```js
copy(g_rgAchievementShowcaseGamesWithAchievements);
```
this command will copy to the Clipboard the games you have at least one achievement unlocked in
    
* Paste (CTRL+V) in the field **Games with achievements JSON**
* Press **Submit**
* Enjoy and have a good achievement hunting.

## Built With

* [Bootstrap v3.3.7](https://getbootstrap.com/docs/3.3/) - The web framework used
* [tablesorter (fork by Rob Garrison)](https://mottie.github.io/tablesorter/docs/) - Dependency Management

## Uses

* [Steam Web API](https://developer.valvesoftware.com/wiki/Steam_Web_API)

## Commendation

Here's a site that does the same thing as this project: [completionist.me](https://completionist.me).

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details