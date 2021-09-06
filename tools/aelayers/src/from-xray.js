
function makeNode() {
}

function fromXray(json) {

  if (!json['Services'] || type(json['Services'].length) !== 'number') {
    throw new Error('Invalid xray JSON');
  }


  return [nodes, edges];

}

module.exports = fromXray;
