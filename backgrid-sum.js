(function (window) {
  var SummationUtility = {
    columnsToSum: [],
    multiplier: null,

    getColumnsToSum: function () {
      var columns = this.columns.without(this.columns.findWhere({ name: this.multiplier }));
      if (_(this.columnsToSum).isEmpty() === false) {
        columns = columns.filter(function (column) {
          return this.columnsToSum.indexOf(column.get('name')) !== -1;
        }, this);
      }
      return columns;
    },

    getSum: function () {
      return _(this.getColumnsToSum()).reduce(this.addColumnValue, 0, this);
    },

    addColumnValue: function (memo, column) {
      var value = this.model.get(column.get('name'));
      var multiplier = 1;

      if (this.multiplier) {
        if (isNaN(parseFloat(this.multiplier))) {
          multiplier = this.model.get(this.getColumnByName(this.multiplier).get('name'));
        } else {
          multiplier = parseFloat(this.multiplier);
        }
      }

      return memo + (parseFloat(value) * multiplier);
    }
  };

  var SummedRow = window.Backgrid.SummedRow = window.Backgrid.Row.extend({
    formatter: Backgrid.StringFormatter,

    render: function () {
      this.$el.empty();

      var fragment = document.createDocumentFragment();
      _(this.cells).each(function (cell) {
        fragment.appendChild(cell.render().el);
      });
      fragment.appendChild(this.getSumCell().render().el);

      this.el.appendChild(fragment);
      this.delegateEvents();
      return this;
    },

    getColumnByName: function (name) {
      return this.columns.findWhere({ name: name });
    },

    getSumCell: function () {
      var _this = this;
      return new (
        Backgrid.Cell.extend({
          className: _this.className || '',
          initialize: function () { },
          render: function () {
            this.$el.html(new _this.formatter().fromRaw(_this.getSum(), _this.model));
            return this;
          }
        })
      );
    }
  });

  var SummedColumnBody = window.Backgrid.SummedColumnBody = window.Backgrid.Body.extend({
    formatter: Backgrid.StringFormatter,

    render: function () {
      window.Backgrid.Body.prototype.render.apply(this, arguments); 
      this.el.appendChild(this.getSumRow().render().el);
      return this;
    },

    getSumRow: function () {
      var _this = this;
      return new (
        Backbone.View.extend({
          className: _this.className || '',
          tagName: 'tr',
          render: function () {
            _(_this.getColumnsToSum()).each(function (column) {
              var values = _this.collection.pluck(column.get('name'));
              var sum = _.reduce(values, function (memo, num) {
                return memo + parseFloat(num);
              }, 0);
              sum = new _this.formatter().fromRaw(sum, _this.model);
              this.$el.append('<td class="' + (_this.className || '') + '">' + sum + '</td>');
            }, this);

            return this;
          }
        })
      );
    }
  });

  _(SummedRow.prototype).extend(SummationUtility);
  _(SummedColumnBody.prototype).extend(SummationUtility);
})(window);
