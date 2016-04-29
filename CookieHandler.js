$(function () {
    var saveInCookie = function (name, value) {
        Cookies.set(name, value, { expires: 7 });
    };

    var getFromCookie = function (name) {
        return Cookies.getJSON(name);
    };

    window.CookieHandler = this;
    window.CookieHandler.saveInCookie = saveInCookie;
    window.CookieHandler.getFromCookie = getFromCookie;
});