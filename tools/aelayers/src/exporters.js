const stringify = require('csv-stringify/lib/sync')

function gmlAttrsToString(el) {
  // console.error(el);
  let str = '';
  let attrs = el.attrs || {};
  try {
    Object.entries(attrs).forEach(([k, v]) => {
      str += `
          ${k} "${v}"`;
    });
  } catch (e) {
    console.error('Error with ', el);
  }
  return str;
}

function toGML(arr) {
  let output = [];
  output.push(`
graph [
    id 0
    label "Graph"
    `);

  arr.forEach((el) => {
    let str = '';
    switch (el.layer) {
      case 'data':
        str = `
    node [
        id ${el.id}
        label "${el.label}"
        layer ${el.layer}
`;
        str += gmlAttrsToString(el);
        str += `
    ]`;
        output.push(str);

        break;
      case 'compute':
        str = `
    node [
        id ${el.id}
        label "${el.label}"
        layer ${el.layer}
`;

        str += gmlAttrsToString(el);
        str += `
    ]`;
        output.push(str);

        break;

      case 'compute_link':
        str = `
    edge [
        id ${el.id}
        label "${el.label}"
        source ${el.source}
        target ${el.target}
        layer ${el.layer}`;

        str += gmlAttrsToString(el);
        str += `
    ]`;
        output.push(str);
        break;

      case 'data_link':
        str = `
    edge [
        id ${el.id}
        label "${el.label}"
        source ${el.nodes[0]}
        target ${el.nodes[1]}
        layer ${el.layer}`;

        str += gmlAttrsToString(el);
        str += `
    ]`;
        output.push(str);
        break;

      case 'data_access':
        el.targets.forEach((target, idx) => {
          str = `
    edge [
        id ${el.id}_${idx}
        label "${el.label}"
        source ${el.source}
        target ${target}
        layer ${el.layer}`;

          str += gmlAttrsToString(el);
          str += `
    ]`;
          output.push(str);
        });
        break;

      default:
        throw new Error('Unhandled case ' + el.layer);
        break;
    }
  });
  output.push(`
]
`);
  return output.join('\n');
}

function toGMLExpanded(arr) {
  let output = [];
  output.push(`
graph [
    id 0
    label "Graph"
    `);

  arr.forEach((el) => {
    let str = '';
    switch (el.layer) {
      case 'data':
      case 'compute':
        str = `
    node [
        id ${el.id}
        label "${el.label}"
    `;
        str += `
        layer ${el.layer}
`;

        Object.entries(el.attrs).forEach(([k, v]) => {
          str += `
        ${k} "${v}"`;
        });
        str += `
    ]`;
        output.push(str);

        break;

      case 'data_link':
        str = `
    node [
        id ${el.id}
        label "${el.label}"
    `;
        str += `
        layer ${el.layer}
`;

        Object.entries(el.attrs).forEach(([k, v]) => {
          str += `
        ${k} "${v}"`;
        });
        str += `
    ]`;
        output.push(str);
        str = `
    edge [
        id ${el.id}_1
        source ${el.nodes[0]}
        target ${el.id}
        `;
        Object.entries(el.attrs).forEach(([k, v]) => {
          str += `
        ${k} "${v}"`;
        });
        str += `
    ]`;
        output.push(str);
        str = `
    edge [
        id ${el.id}_2
        source ${el.id}
        target ${el.nodes[1]}
        `;
        Object.entries(el.attrs).forEach(([k, v]) => {
          str += `
        ${k} "${v}"`;
        });
        str += `
    ]`;
        output.push(str);

        break;

      case 'data_access':
        str = `
    node [
        id ${el.id}
        label "${el.label}"
    `;
        str += `
        layer ${el.layer}
`;

        Object.entries(el.attrs).forEach(([k, v]) => {
          str += `
        ${k} "${v}"`;
        });
        str += `
    ]`;
        output.push(str);

        str = `
    edge [
        id ${el.id}_${el.source}
        source ${el.source}
        target ${el.id}
        `;
        Object.entries(el.attrs).forEach(([k, v]) => {
          str += `
        ${k} "${v}"`;
        });
        str += `
    ]`;
        output.push(str);

        el.targets.forEach((target, idx) => {
          str = `
    edge [
        id ${el.id}_${target}
        source ${el.id}
        target ${target}
        `;
          Object.entries(el.attrs).forEach(([k, v]) => {
            str += `
        ${k} "${v}"`;
          });
          str += `
    ]`;
          output.push(str);
        });

        break;

      default:
        throw new Error('Unhandled case ' + el.layer);
        break;
    }
  });
  output.push(`
]
`);
  return output.join('\n');
}

function colorForLayer(layer) {
  return (
    {
      data_link: 'yellow',
      data_access: 'magenta',
      data: 'lightgreen',
      compute: 'lightblue'
    }[layer] || 'cyan'
  );
}

function extractAttrs(attrs = {}) {
  return {
    type: attrs.type || 'none'
  };
}

function toF3DJSON(arr) {
  const props = {
    fontcolor: 'white'
  };
  let output = {
    nodes: [],
    links: []
  };

  arr.forEach((el) => {
    switch (el.layer) {

      case 'compute_link':
        output.links.push({
          id: el.id,
          label: el.label,
          name: el.label,
          layer: el.layer,
          source: el.source,
          target: el.target,
          attrs: extractAttrs(el.attrs),
          ...props
        });
        break;

      case 'compute':
        output.nodes.push({
          id: el.id,
          label: el.label,
          name: el.label,
          layer: el.layer,
          attrs: extractAttrs(el.attrs),
          ...props
        });
        break;

      case 'data':
        output.nodes.push({
          id: el.id,
          label: el.label,
          name: el.label,
          layer: el.layer,
          attrs: extractAttrs(el.attrs),
          ...props
        });
        break;

      case 'data_link':
        output.links.push({
          id: el.id,
          label: el.label,
          name: el.label,
          layer: el.layer,
          source: el.nodes[0],
          target: el.nodes[1],
          attrs: extractAttrs(el.attrs),
          ...props
        });
        break;

      case 'data_access':
        el.targets.forEach((t) => {
          output.links.push({
            id: el.id,
            label: el.label,
            name: el.label,
            layer: el.layer,
            source: el.source,
            target: t,
            attrs: extractAttrs(el.attrs),
            ...props
          });
        });
        break;

      default:
        throw new Error('Unhandled case ' + el.layer);
        break;
    }
  });

  return output;
}

function toCSVColumn(str) {
  const val = str.replace(/"/g, '\\"');
  return `"${val}"`;
}

function toCSVx(arr) {
  const attrs = ['id', 'label', 'layer', 'source', 'target', 'targets', 'nodes'];

  arr.forEach(el=> {
gt
    if (el.attrs) {
      for (let key in el.attrs) {
        if (attrs.indexOf(key) < 0) {
          attrs.push(key);
        }
      }
    }

  });


}

function toCSV(arr) {
  const attrs = ['id', 'label', 'layer', 'source', 'target', 'targets', 'nodes'];

  arr.forEach((el) => {
    if (el.attrs) {
      for (let key in el.attrs) {
        if (attrs.indexOf(key) < 0) {
          attrs.push(key);
        }
      }
    }
  });

  const records = arr.map(el => {
    const attrs = el.attrs;
    delete el.attrs;
    return {
      ...attrs,
      ...el,
    };
  });

  return stringify(records, {
    header: true,
    columns: attrs,
    quoted: true,
  });
}

function dataLinksToCSVMatrix(arr) {

  let xrowMap = {};
  let xrowLabels = [];
  arr.filter(el=> el.layer === 'data').forEach(el=> {
    xrowLabels.push(el.label);
    xrowMap[el.id] = el;
  });

  let ycolumnMap = {};
  let ycolumnLabels = [];

  arr.filter(el=> el.layer === 'compute').forEach(el=> {
    ycolumnLabels.push(el.label);
    ycolumnMap[el.id] = el;
  });

  function xPos(id) {
    let label = xrowMap[id].label;
    return xrowsLabels.indexOf(label)
  }

  function yPos(id) {
    let label = yrowMap[id].label;
    return yrowsLabels.indexOf(label)
  }

  let links = arr.filter(el=> el.layer === 'data_access');

  links.forEach(link=> {
    console.log(link);
  });

}

module.exports = {
  toF3DJSON,
  toGML,
  toGMLExpanded,
  toCSV,
  dataLinksToCSVMatrix,
};

