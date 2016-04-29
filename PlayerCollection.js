$(function () {
  var PlayerCollection = Backbone.Collection.extend({
    model: window.PlayerModel
  });
  window.PlayerCollection = PlayerCollection;
});