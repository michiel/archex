const stringify = require('csv-stringify/lib/sync')

function gmlAttrsToString(el) {
  let attrsAllowed = [
    'type',
    'extractor',
    'querytype',
  ];
  // console.error(el);
  let str = '';
  let attrs = el.attrs || {};
  try {
    Object.entries(attrs).forEach(([k, v]) => {
      if (attrsAllowed.indexOf(k) > -1) {
        str += `
            ${k} "${v}"`;
      }
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
        source ${el.source}
        target ${el.target}
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
        str = `
    edge [
        id ${el.id}_2
        source ${el.id}
        target ${el.target}
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
          source: el.source,
          target: el.target,
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

function toCSV(arr) {
  const attrs = ['id', 'label', 'layer', 'source', 'target', 'targets', 'nodes', 'type', 'extractor', 'querytype', 'query'];
  const list = arr.map(el=> { 
    let obj = JSON.parse(JSON.stringify(el));
    obj['attrs'] = obj['attrs'] || {};
    obj.type = obj.attrs.type;
    obj.extractor = obj.attrs.extractor;
    obj.querytype = obj.attrs.querytype;
    obj.query = obj.attrs.query;
    if (Array.isArray(obj.nodes)) {
      obj.nodes = obj.nodes.join(';');
    }
    if (Array.isArray(obj.targets)) {
      obj.targets = obj.targets.join(';');
    }
    delete obj['attrs'];
    return obj;
  });

  return stringify(list, {
    header: true,
    columns: attrs,
    quoted: true,
  });

}

/*
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
*/

function dataAccessToCSVMatrix(arr) {

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
    return xrowLabels.indexOf(label) + 1
  }

  function yPos(id) {
    let label = ycolumnMap[id].label;
    return ycolumnLabels.indexOf(label) + 1
  }

  let matrix = [
    ['x'].concat(xrowLabels)
  ];

  function makeRow(label) {
    return [label].concat(xrowLabels.map(el=>0));
  }

  ycolumnLabels.forEach(col=> {
    matrix.push(makeRow(col));
  });

  function bump(yId, xId) {
    matrix[yPos(yId)][xPos(xId)] += 1;
  }

  let links = arr.filter(el=> el.layer === 'data_access');

  links.forEach(link=> {
    link.targets.forEach(t => {
      bump(link.source, t);
    });
  });

  return stringify(matrix, {
    header: false,
    // columns: attrs,
    quoted: false,
  });

}

function dataLinksToCSVMatrix(arr) {

  let xrowMap = {};
  let xrowLabels = [];

  let ycolumnMap = {};
  let ycolumnLabels = [];

  arr.filter(el=> el.layer === 'data').forEach(el=> {
    xrowLabels.push(el.label);
    xrowMap[el.id] = el;

    ycolumnLabels.push(el.label);
    ycolumnMap[el.id] = el;
  });

  function xPos(id) {
    let label = xrowMap[id].label;
    return xrowLabels.indexOf(label) + 1
  }

  function yPos(id) {
    let label = ycolumnMap[id].label;
    return ycolumnLabels.indexOf(label) + 1
  }

  let matrix = [
    ['x'].concat(xrowLabels)
  ];

  function makeRow(label) {
    return [label].concat(xrowLabels.map(el=>0));
  }

  ycolumnLabels.forEach(col=> {
    matrix.push(makeRow(col));
  });

  function bump(yId, xId) {
    console.log(yId, xId);
    matrix[yPos(yId)][xPos(xId)] += 1;
  }

  let links = arr.filter(el=> el.layer === 'data_link');

  links.forEach(link=> {
    bump(link.source, link.target);
  });

  return stringify(matrix, {
    header: false,
    // columns: attrs,
    quoted: false,
  });

}

module.exports = {
  toF3DJSON,
  toGML,
  toGMLExpanded,
  toCSV,
  dataLinksToCSVMatrix,
  dataAccessToCSVMatrix,
};

