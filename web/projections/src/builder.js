const companyData = window.visualizationData;

const makeNode = (name, type='label') => {
  return {
    id: name,
    name: name,
    label: name,
    color: colorFor(name),
    type: type,
    value: 10,
  };
}

const colorFor = (link) => {
  let lookup = (window.visualizationDataSettings &&
    window.visualizationDataSettings.colors) ?
    window.visualizationDataSettings.colors : {};
  let res = lookup[link];
  return res ? res : 'pink';
}

const linksFor = (source, rootNode, nodeList) => {
  source.forEach(nodeName=> {
    if (!nodeList[nodeName]) {
      nodeList[nodeName] = {
        node: makeNode(nodeName),
        links : [rootNode.id],
      };
    } else {
      nodeList[nodeName].links.push(rootNode.id);
    }
  });
}

const buildAll = () => {
  let nodeList = {};
  let rootNodes = [];
  Object.entries(companyData).forEach(entry => {
    const key = entry[0];
    const val = entry[1];
    let node = makeNode(key, 'root');
    rootNodes.push(node);
    linksFor(val, node, nodeList);
  });

  let links = [];
  Object.entries(nodeList).forEach(kv=> {
    const node = kv[1];
    node.links.forEach(link => {
      links.push({
        source: node.node.id,
        target: link,
        color: colorFor(link),
        value: 3,
      });
    });
  });

  let nodes = Object.values(nodeList).map(v => v.node).concat(rootNodes);

  return [
    nodes,
    links
  ];
}

const [nodes, links] = buildAll();
console.log('nodes', nodes);
console.log('links', links);
const gData = {
  nodes: nodes,
  links: links,
};

export {
  gData
}

