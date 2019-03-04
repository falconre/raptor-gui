function Tab(name, html) {
  this._name = name;
  this._html = html;
  this._uniqueId = 

  this.name = function () { return this._name; }
  this.html = function () { return this._html; }
}


function Tabs() {
  this._tabs = []
  this._current_li = null;
  this._is_shown = true;

  this.add = function(tab) {
    var sidebar_tab_close =
      $("<div>")
        .attr("class", "sidebar-tab-close")
        .html("&nbsp;");

    var sidebar_tab_show =
      $("<div>")
        .attr("class", "sidebar-tab-show")
        .html(tab.name());

    var li =
      $("<li>")
        .append(sidebar_tab_close)
        .append(sidebar_tab_show);

    sidebar_tab_show.click(function() {
      TABS.show(tab, li);
    })

    $("#sidebar-tabs ul").append(li);

    sidebar_tab_close.click(function () {
      TABS.close(li);
    })

    this.show(tab, li);
  }

  this.show = function (tab, li) {
    $("#sidebar-inner").empty();
    $("#sidebar-inner").append(tab.html());
    this._current_li = li;

    if (!this._is_shown) {
      this.toggle();
    }
  }

  this.close = function (li) {
    if (this._current_li == li) {
      if (this._is_shown) { this.toggle(); }
      this._current_li = null;
      $("#sidebar-inner").empty();
    }
    li.remove();
  }

  this.toggle = function () {
    $("#sidebar-inner").animate({ width: "toggle" });
    this._is_shown = !this._is_shown;
  }
}

function tabs_init() {
  TABS = new Tabs();

  $("#sidebar-tabs-toggle").click(function () { TABS.toggle() });
  TABS.toggle();
}