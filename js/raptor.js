URL = "http://localhost:3030/";

function jsonRpc(method, params, success) {
  $.ajax({
    url: URL,
    type: "POST",
    data: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: method,
      params: params
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: success
  });
}

function selectInstruction(block_index, instruction_index) {
  console.log(block_index, instruction_index);
}

function scalarClick(context) {
  console.log("scalarClick", context);
}

function stackVariableClick(context) {
  console.log("stackVariableClick", context);
}

function constantAddressClick(context) {
  var context = JSON.parse(context);
  var address = parseInt(context.constant.value, 0);

  // Start by creating an outer ul for each function.
  var functions = $("<ul>");

  // Create an li for Unknown Function, because we don't yet know which function
  // these xrefs belong to
  var unknownFunctionLi =
    $("<li>").html(
      $("<span>").attr("style", "font-weight: bold")
                 .html("Unknown Function")
    );

  // The function li has it's own inner ul for each function
  var ul2 = $("<ul>");
  unknownFunctionLi.append(ul2);
  functions.append(unknownFunctionLi);
  var xrefs = STATE.xrefs_to(address);

  for (var i in xrefs) {
    var xref = xrefs[i];
    var li = $("<li>").html("0x" + hex(xref));
    ul2.append(li);

    var closure = function(functions, li) {
      var functions = functions;
      var ihatejavascript = li;

      return (function (json_response) {
        // Didn't receive anything, exit early.
        if (json_response["result"] == null) return;

        var li = ihatejavascript;

        // Remove from current parent/function
        var result = json_response.result;
        var parentUl = li.parent();
        li.remove();

        // // If parent is now empty, remove it as well.
        if (parentUl.children().length == 0) {
          parentUl.parent().remove();
        }

        // Get the function li for this instruction, or create it if
        // it doesn't exist
        var functionUl = null;
        functions.children("*").each(function (idx, li) {
          if (jQuery.data(this, "function-index") == result["function-index"]) {
            functionUl = jQuery.data(this, "function-ul");
          }
        });

        if (functionUl == null) {
          var functionLi =
            $("<li>").html(
              $("<span>").attr("style", "font-weight: bold")
                         .html(result["function-name"]));
          functionUl = $("<ul>");
          functionLi.data("function-index", result["function-index"]);
          functionLi.data("function-ul", functionUl);

          functionLi.append(functionUl);
          functions.append(functionLi);
        }

        functionUl.append(
          $("<li>").html(render_instruction(result.instruction)));
      });
    }(functions, li);

    jsonRpc("instruction-at",
            {"document-name": STATE.documentName(), "address": xref},
            closure);
  }

  $("#sidebar-inner").html(functions);

  var tab = new Tab("XRef " + hex(address), functions);
  TABS.add(tab);
}

function State() {
  this.documents = [];
  this.selectedDocument = null;
  this.documentXRefs = null;
  this.functions = [];
  this.selectedFunction = null;

  this.documentName = function () {
    return this.selectedDocument;
  }

  this.xrefs_from = function (address) {
    if (this.documentXRefs == null)
      return null;
    return this.documentXRefs.from_to[address];
  }

  this.xrefs_to = function (address) {
    if (this.documentXRefs == null)
      return null;
    return this.documentXRefs.to_from[address];
  }

  this.setDocuments = function (documents) {
    var state = this;
    this.documents = documents;
    $("#documents").empty();
    for (var i in documents) {
      var documentName = documents[i];
      $("#documents").append(
        $("<option>")
          .attr("value", documentName)
          .append(documentName)
          .click(function () {
            var test = documentName;
            return function () {
              var documentName = test;
              state.selectDocument(documentName);
            }
          }()));
    }
  }

  this.initialize = function() {
    var state = this;
    jsonRpc("documents", {}, function (response) {
      state.setDocuments(response["result"]);
      state.selectDocument(state.documents[0]);
    });
  }

  this.selectDocument = function (documentName) {
    this.selectedDocument = documentName;
    var state = this;
    jsonRpc("document-xrefs",
            {"document-name": documentName},
            function (response) {
      state.documentXRefs = response["result"];
    })
    jsonRpc("document-functions",
            {"document-name": documentName},
            function (response) {
      state.functions = response["result"];
      $("#functions-list").empty();
      for (var i in state.functions) {
        var f = state.functions[i];
        var li = $("<li>").append(f.name);
        var index = f.index;
        li.click(function () {
          var index = f.index;
          return function() { state.selectFunction(index); }
        }());
        $("#functions-list").append(li);
      }
      // https://stackoverflow.com/questions/304396/what-is-the-easiest-way-to-order-a-ul-ol-in-jquery
      var items = $("#functions-list > li").get();
      items.sort(function(lhs, rhs) {
        if ($(lhs).text() < $(rhs).text()) return -1;
        else if ($(lhs).text() > $(rhs).text()) return 1;
        return 0;
      });
      $.each(items, function(i, li) {
        $("#functions-list").append(li);
      });
    });
  }

  this.selectFunction = function(index) {
    var state = this;
    jsonRpc("function-ir",
            {"document-name": this.selectedDocument, "function-index": index},
            function (response) {
      state.selectedFunction = response["result"];
      state.renderFunction();
    });
  }

  this.renderFunction = function() {
    renderFunction(this.selectedFunction);
  }
}

var STATE = new State();
STATE.initialize();

function branching_condition_false(expression) {
  if (expression.op != "cmpeq") return false;
  if (expression.lhs.name != "branching_condition") return false;
  if (expression.rhs.value != 0) return false;
  return true; 
}

function branching_condition_true(expression) {
  if (expression.type != "scalar") return false;
  if (expression.name != "branching_condition") return false;
  return true;
}


function renderFunction(irFunction) {

  // Create the input graph
  var g = new dagreD3.graphlib.Graph()
    .setGraph({})
    .setDefaultEdgeLabel(function() { return {}; });

  var svg = d3.select("svg");
  var inner = svg.select("g");

  // Set up zoom support
  var zoom = d3.zoom().on("zoom", function() {
        inner.attr("transform", d3.event.transform);
      });
  svg.call(zoom.transform, d3.zoomIdentity);
  svg.call(zoom);

  for (block_index in irFunction.blocks) {
    var block = irFunction.blocks[block_index];
    var label = render_block_table(block, {function: irFunction});
    g.setNode(block.index, {
      labelType: "html",
      label: label,
      rx: 5,
      ry: 5,
      padding: 8
    });
  }

  for (edge_index in irFunction.edges) {
    var edge = irFunction.edges[edge_index];
    var options = {
      labelType: "html",
    };
    if (edge.condition) {
      if (branching_condition_false(edge.condition)) {
        options.style = "stroke: #f09; stroke-width: 3px;";
        options.arrowheadStyle = "fill: #f09;"
        options.arrowheadClass = "arrowhead";
      }
      else if (branching_condition_true(edge.condition)) {
        options.style = "stroke: #090; stroke-width: 3px;";
        options.arrowheadStyle = "fill: #090;"
        options.arrowheadClass = "arrowhead";
      }
      else {
        options.label = render_expression(edge.condition);
        options.style = "stroke: #609; stroke-width: 3px;";
        options.arrowheadStyle = "fill: #609;"
        options.arrowheadClass = "arrowhead";
      }
    }
    else {
      options.style = "stroke: #000; stroke-width: 3px;";
      options.arrowheadStyle = "fill: #000;"
      options.arrowheadClass = "arrowhead";
    }
    g.setEdge(edge.head, edge.tail, options);
  }

  g.nodes().forEach(function(v) {
    var node = g.node(v);
    // Round the corners of the nodes
    node.rx = node.ry = 5;
  });


  // Create the renderer
  var render = new dagreD3.render();

  // Run the renderer. This is what draws the final graph.
  render(inner, g);
}
