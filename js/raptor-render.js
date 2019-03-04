function hex(value, options) {
  function hex_char(value) {
    if (value == 0) { return "0"; }
    else if (value == 1) { return "1"; }
    else if (value == 2) { return "2"; }
    else if (value == 3) { return "3"; }
    else if (value == 4) { return "4"; }
    else if (value == 5) { return "5"; }
    else if (value == 6) { return "6"; }
    else if (value == 7) { return "7"; }
    else if (value == 8) { return "8"; }
    else if (value == 9) { return "9"; }
    else if (value == 10) { return "a"; }
    else if (value == 11) { return "b"; }
    else if (value == 12) { return "c"; }
    else if (value == 13) { return "d"; }
    else if (value == 14) { return "e"; }
    else if (value == 15) { return "f"; }
  }

  var s = "";
  while (value > 0) {
    var hi = (value >> 4) & 0xf;
    var lo = value & 0xf;
    value = value >> 8;
    s = hex_char(hi) + hex_char(lo) + s;
  }

  if ((s.length & 1) > 0) {
    s = "0" + s;
  }

  if (options != null) {
    if (options.leading_zeroes > 0) {
      while (s.length < options.leading_zeroes) {
        s = "0" + s;
      }
    }
  }

  return s;
}


function render_scalar(scalar, context) {
  if (context) {
    var context = Object.assign(context, { scalar: scalar });

    return "<a class=\"irScalar\" href=\"#\" onClick=scalarClick(\"" +
           JSON.stringify(context).replace(/\"/g, "\\\"") +
           "\")>" +
           scalar.name +
           ":" +
           scalar.bits +
           "</a>";
  }
  else
    return "<span class=\"irScalar\">" +
           scalar.name +
           ":" +
           scalar.bits +
           "</span>";
}

function render_stack_variable(stack_variable, context) {
  var pre = "<span class=\"irStackVariable\">";
  var post = "</span>";
  if (context) {
    var context = Object.assign(context, { stack_variable: stack_variable });

    pre = "<a class=\"irStackVariable\" href=\"#\" onClick=stackVariableClick(\"" +
          JSON.stringify(context).replace(/\"/g, "\\\"") +
          "\")>";
    post = "</a>"
  }
  if (stack_variable.offset < 0) {
    return pre +
           "var_0x" +
           hex(stack_variable.offset * -1, {leading_zeroes: 2}) +
           ":" +
           stack_variable.bits +
           post;
  }
  else {
    return pre +
           "arg_0x" +
           hex(stack_variable.offset, {leading_zeroes: 2}) +
           ":" +
           stack_variable.bits +
           post;
  }
}

function render_variable(variable, context) {
  if (variable.type == "scalar") {
    return render_scalar(variable, context);
  }
  else if (variable.type == "stack_variable") {
    return render_stack_variable(variable, context);
  }
}

function render_constant(constant, context) {
  if (context) {
    var context = Object.assign(context, {"constant": constant});

    return "<a href=\"#\" class=\"irConstant\" onClick=constantAddressClick(\"" +
           JSON.stringify(context).replace(/\"/g, "\\\"") +
           "\")>" +
           constant.value +
           ":" +
           constant.bits +
           "</a>";
  }
  else {
    console.log("No context!");
    return "<span class=\"irConstant\">" +
           constant.value +
           ":" +
           constant.bits +
           "</span>";
  }
}

function render_dereference(dereference, context) {
  return "*(" + render_expression(dereference.expression, context) + ")"
}

function render_reference(reference, context) {
  return "&(" + render_expression(reference.expression, context) + ")"
}


function render_expression(e, context) {
  var re = render_expression;
  var c = context;

  if (e.type == "scalar") return render_scalar(e, c);
  else if (e.type == "stack_variable") return render_stack_variable(e, c);
  else if (e.type == "reference") return render_reference(e, c);
  else if (e.type == "dereference") return render_dereference(e, c);
  else if (e.type == "constant") return render_constant(e, c);
  else if (e.op == "add") return "(" + re(e.lhs, c) + " + " + re(e.rhs, c) + ")";
  else if (e.op == "sub") return "(" + re(e.lhs, c) + " - " + re(e.rhs, c) + ")";
  else if (e.op == "mul") return "(" + re(e.lhs, c) + " * " + re(e.rhs, c) + ")";
  else if (e.op == "divu") return "(" + re(e.lhs, c) + " /u " + re(e.rhs, c) + ")";
  else if (e.op == "modu") return "(" + re(e.lhs, c) + " %u " + re(e.rhs, c) + ")";
  else if (e.op == "divs") return "(" + re(e.lhs, c) + " /s " + re(e.rhs, c) + ")";
  else if (e.op == "mods") return "(" + re(e.lhs, c) + " %s " + re(e.rhs, c) + ")";
  else if (e.op == "and") return "(" + re(e.lhs, c) + " &amp; " + re(e.rhs, c) + ")";
  else if (e.op == "or") return "(" + re(e.lhs, c) + " | " + re(e.rhs, c) + ")";
  else if (e.op == "xor") return "(" + re(e.lhs, c) + " ^ " + re(e.rhs, c) + ")";
  else if (e.op == "shl") return "(" + re(e.lhs, c) + " &lt;&lt; " + re(e.rhs, c) + ")";
  else if (e.op == "shr") return "(" + re(e.lhs, c) + " &gt;&gt; " + re(e.rhs, c) + ")";
  else if (e.op == "cmpeq") return "(" + re(e.lhs, c) + " == " + re(e.rhs, c) + ")";
  else if (e.op == "cmpneq") return "(" + re(e.lhs, c) + " != " + re(e.rhs, c) + ")";
  else if (e.op == "cmplts") return "(" + re(e.lhs, c) + " &lt;s " + re(e.rhs, c) + ")";
  else if (e.op == "cmpltu") return "(" + re(e.lhs, c) + " &lt;u " + re(e.rhs, c) + ")";
  else if (e.op == "trun") return "trun." + e.bits + "(" + re(e.rhs, c) + ")";
  else if (e.op == "sext") return "sext." + e.bits + "(" + re(e.rhs, c) + ")";
  else if (e.op == "zext") return "zext." + e.bits + "(" + re(e.rhs, c) + ")";
  else if (e.op == "ite")
    return "ite(" + re(e.cond, c) + ", " + re(e.then, c) + ", " + re(e.else, c) + ")";
}


function render_call(call, context_in) {
  var context = { call: call };
  if (context_in != null)
    context = Object.assign(context_in, context);

  var arguments = "";
  for (i in call.arguments) {
    if (i > 0) { arguments += ", "; }
    arguments += render_expression(call.arguments[i], context);
  }

  if (call.arguments == null) { arguments = "???"; }

  if (call.target.type == "expression") {
    return "call " + render_expression(call.target.expression, context);
  }
  else if (call.target.type == "symbol") {
    return "<span class=\"irCall\">" +
           call.target.symbol + 
           "</span>" + 
           "(" + arguments + ")";
  }
  else if (call.target.type == "function_id") {
    return "id_0x" + hex(call.target.function_id) + "(" + arguments + ")";
  }
}


function render_operation(o, context_in) {
  var context = {operation: o};
  if (context_in != null)
    context = Object.assign(context_in, context);

  if (o.operation == "assign") {
    return render_variable(o.dst, Object.assign(context, {operand: "dst"})) +
           " = " +
           render_expression(o.src, Object.assign(context, {operand: "src"}));
  }
  else if (o.operation == "store")
    return "[" +
           render_expression(o.index, Object.assign(context, {operand: "index"})) +
           "] = " +
           render_expression(o.src, Object.assign(context, {operand: "src"}));
  else if (o.operation == "load") {
    var index = render_expression(o.index, Object.assign(context, {operand: "index"}));
    return render_variable(o.dst, Object.assign(context, {operand: "dst"})) +
           " = [" +
           index +
           "]";
  }
  else if (o.operation == "branch")
    return "branch " +
           render_expression(o.target, Object.assign(context, {operand: "target"}));
  else if (o.operation == "call") return render_call(o.call, context);
  else if (o.operation == "intrinsic") return o.intrinsic.instruction_str;
  else if (o.operation == "return") {
    if (o.operation.result)
      return "return " + render_expression(o.operation.result, context);
    else
      return "return";
  }
  else if (o.operation == "nop") return "nop";
}


function render_operation_table(o, context_in) {
  var context = {operation: o};
  if (context_in != null)
    context = Object.assign(context_in, context);

  if (o.operation == "assign") {
    return "<td class=\"operationLhs\">" + 
           render_variable(o.dst, Object.assign(context, {operand: "dst"})) +
           "</td><td>=</td><td class=\"operationRhs\">" +
           render_expression(o.src, Object.assign(context, {operand: "src"})) +
           "</td>";
  }
  else if (o.operation == "store")
    return "<td class=\"operationLhs\">[" +
           render_expression(o.index, Object.assign(context, {operand: "index"})) +
           "]</td><td>=</td><td class=\"operationRhs\">" +
           render_expression(o.src, Object.assign(context, {operand: "src"})) +
           "</td>";
  else if (o.operation == "load") {
    var index = render_expression(o.index, Object.assign(context, {operand: "index"}));
    return "<td class=\"operationLhs\">" + 
           render_variable(o.dst, Object.assign(context, {operand: "dst"})) +
           "</td><td>=</td><td class=\"operationRhs\">[" +
           index +
           "]</td>";
  }
  else if (o.operation == "branch")
    return "<td class=\"operationLhs\">branch</td><td></td><td class=\"operationRhs\">" +
           render_expression(o.target, Object.assign(context, {operand: "target"})) +
           "</td>";
  else if (o.operation == "call")
    return "<td colspan=\"3\" style=\"text-align: center;\">" +
           render_call(o.call, context) +
           "</td>";
  else if (o.operation == "intrinsic")
    return "<td colspan=\"3\">" + o.intrinsic.instruction_str + "</td>";
  else if (o.operation == "return") {
    if (o.operation.result)
      return "<td class=\"operationLhs\">return</td><td></td>" +
             "<td class=\"operationRhs\">" +
             render_expression(o.operation.result) +
             "</td>";
    else
      return "<td class=\"operationLhs\">return</td><td></td>" +
             "<td class=\"operatinRhs\"></td>";
  }
  else if (o.operation == "nop")
    return "<td colspan=\"3\">nop</td>";
}


function render_instruction(instruction, context) {
  var context = null;
  if (context != null)
    context = Object.assign(context, {instruction: instruction});

  var html =
     hex(instruction.index, {leading_zeroes: 2}) +
     " 0x" + 
     hex(instruction.address) +
     " " +
     render_operation(instruction.operation, context);

  if (instruction.comment != null) {
    html += " <span class=\"irComment\">// " +
            instruction.comment +
            "</span>";
  }

  html += "</td></tr>";

  return html;
}


function render_instruction_table(instruction, context) {
  var context = null;
  if (context != null)
    context = Object.assign(context, {instruction: instruction});

  var html =
     "<tr><td>" +
     hex(instruction.index, {leading_zeroes: 2}) +
     " 0x" + 
     hex(instruction.address) +
     "</td>" +
     render_operation_table(instruction.operation, context) + 
     "<td>";

  if (instruction.comment != null) {
    html += "<span class=\"irComment\">// " +
            instruction.comment +
            "</span>";
  }

  html += "</td></tr>";

  return html;
}


function render_block(block, context) {
  var context = Object.assign(context, {block: block});

  var html = "<ul class=\"block\">";

  render_instructions = [];
  for (i in block.instructions) {
    var instruction = block.instructions[i];
    if (instruction.operation.operation != "nop") { render_instructions.push(instruction); }
  }

  var html = "";
  for (i in render_instructions) {
    var instruction = render_instructions[i];
    if (i > 0) { html = html + "\n"; }
    html += render_instruction(instruction);
  }
  html += "</ul>";

  return html;
}


function render_block_table(block, context) {
  var context = Object.assign(context, {block: block});

  // var html = "<ul class=\"block\">";
  var html = "<table>";

  render_instructions = [];
  for (i in block.instructions) {
    var instruction = block.instructions[i];
    if (instruction.operation.operation != "nop") { render_instructions.push(instruction); }
  }

  // var html = "";
  for (i in render_instructions) {
    var instruction = render_instructions[i];
    if (i > 0) { html = html + "\n"; }
    // html += render_instruction(instruction);
    // html += "<li class=\"irInstructionLi\" onClick=\"selectInstruction(" +
    //         block.index + 
    //         ", " +
    //         instruction.index + 
    //         ")\">" +
    //         render_instruction(instruction) +
    //         "</li>";
    html += render_instruction_table(instruction);
  }
  html += "</table>";

  return html;
}