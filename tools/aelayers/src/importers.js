const parse = require('csv-parse/lib/sync');
const {toId} = require('./util');

function fromCSVMatrix(data) {
  const records = parse(data, {
    columns: false,
  });

  function asId(group, aspect) {
    return toId(`${group.toLowerCase()}_${aspect.toLowerCase()}`);
  }

  const dataComponents = [];
  const dataLinks = [];

  records[0].forEach((col, idx)=> {
    if ((idx === 0) || (idx === 1) || idx === records.length - 1) {
      return;
    } else {
      const id = asId(records[0][idx], records[1][idx]);
      dataComponents.push({
        id: id,
        layer: 'data',
        label: records[1][idx],
        attrs: {
          extractor: records[0][idx],
          type: records[0][idx],
        }
      });
    }
  });

  console.error(records.length);
  for (let x=2;x<records.length-1;x++) {
    for (let y=2;y<records.length-1;y++) {
      const cell = records[x][y];
      console.error(cell, x, y);
      if (cell === 'x') {
        dataLinks.push({
          id: `link_${x}_${y}`,
          label: 'Link',
          layer: 'data_link',
          source: asId(records[x][0], records[x][1]),
          target: asId(records[0][y], records[1][y]),
        });
      }
    }
  }
  console.error(dataLinks);
  return dataComponents.concat(dataLinks);
}

module.exports = {
  fromCSVMatrix,
}
