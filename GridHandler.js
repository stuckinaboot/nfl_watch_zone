$(function () {
    var generateGrid = function (columns, collection, idToAppendTo) {
        // Create a new instance of Grid
        var grid = new Backgrid.Grid({
          columns: columns,
          collection: collection
        });

        var idStr = '#' + idToAppendTo;
        $(idStr).append(grid.render().el);
        
        return grid;
    };
    window.GridHandler = generateGrid;
});