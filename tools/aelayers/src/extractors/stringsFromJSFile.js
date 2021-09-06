const fs = require("fs");
const esprima = require("esprima");
const estraverse = require("estraverse");

function extractor(filename) {
  const lines = [];
  const ast = esprima.parseScript(
      fs.readFileSync(filename).toString()
  );

  estraverse.traverse(ast, {
    enter: (node, parent) => {
      let val = '';
      // console.log(node.type);
      if (node.type === "TemplateLiteral") {
        // val = node.quasis.map(q => q.value.cooked).join(" '1' ");
        val = node.quasis.map(q => q.value.cooked).join(" ");
        // val = val.replace(/\#.*\n/g, '\n');
        // val = val.replace(/\n/g, '');
        // val = val.replace(/\s+/g, ' ');

      }
      if (node.type === "Literal") {
        // console.error(node.value);
        val = node.raw;
      }
      /*
      if (node.type === "TemplateElement") {
        console.log(node.value);
        val = node.value.raw;
        val = val.replace(/\#.*\n/g, '\n');
        val = val.replace(/\n/g, '');
        val = val.replace(/\s+/g, ' ');
      }

      if (val.match(/FROM /i)) {
        val.split(';').forEach(v => lines.push(v));
      }
      */

      lines.push(val);
    }
  });


  return lines.filter(s=> s.replace(/\s+/g, '') !== '');
}

module.exports = extractor;
