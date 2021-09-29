const glob = require('glob');

function toId(str) {
  return str
    .replace(/-/g, '_')
    .replace(/\./g, '_')
    .replace(/ /g, ' ')
    .toLowerCase();
}

function tableId(database, table) {
  return toId(`data_${database}_table_${table}`);
}

function componentId(str) {
  return toId(`component_${str}`);
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function mergeElements(arr) {
  const allIds = arr.map((el) => el.id);
  const uniqueIds = new Set(allIds);
  const duplicates = new Set(
    allIds.filter((el) => {
      if (uniqueIds.has(el.id)) {
        uniqueIds.delete(el.id);
        return false;
      } else {
        return true;
      }
    })
  );

  const res = [];

  const completed = new Set();
  arr.forEach((el) => {
    if (!duplicates.has(el.id)) {
      res.push(el);
    } else if (!completed.has(el.id)) {
      const dups = arr.filter((e) => e.id === el.id);
      const merged = dups.reduce(
        (acc, curr) => {
          return {
            ...acc,
            ...curr,
            attrs: {
              ...acc.attrs,
              ...curr.attrs
            }
          };
        },
        { attrs: {} }
      );
      res.push(merged);
    }
    completed.add(el.id);
  });

  return res;
}

function pluralise(arr) {
  return arr.map(e=> `${e}s`);
}

function buildTableVariations(str) {
  let res = buildTableVariationsFromCamelCase(str);
  res = res.concat(pluralise(res));
  return res;
}
function buildTableVariationsFromCamelCase(str) {
  const vars = [];

  let variation = str.toLowerCase();
  vars.push(variation);

  variation = str;
  vars.push(variation);

  variation = variation.replace(/([A-Z])/g, '_$1').replace(/^_/, '');
  vars.push(variation);

  variation = variation.replace(/^./, function (str) {
    return str.toUpperCase();
  });
  vars.push(variation);

  variation = variation.toLowerCase();
  vars.push(variation);

  return vars;
}

async function extractAll(path, extension, fileExtractor) {
  return new Promise((resolve, reject) => {
    const res = {};
    glob(`${path}/**/*.${extension}`, {}, function (err, files) {
      if (files.length === 0) {
        throw new Error(`0 files found extracting type:${extension} from path:${path}`);
      }
      files.forEach((file) => {
        try {
          res[file] = fileExtractor(file);
        } catch (e) {
          console.error(`Unable to process file ${file} : ${e}`);
        }
      });
      resolve(res);
    });
  });
}

function summary(arr) {
  const layers = arr.map((el) => el.layer).filter(onlyUnique);
  const layerData = {};
  layers.forEach((layer) => {
    layerData[layer] = arr.filter((el) => el.layer === layer).length;
  });
  return {
    total: arr.length,
    layers: layerData
  };
}

function createDataAccessConnections(source, targets) {
  let i=0;
  return targets.map(t=> {
    return {
      id: `placeholder_${i++}`,
      layer: 'data_link',
      source: source.id,
      targets: [t.id],
      attrs: {
        type: 'DatabaseToTable',
        extractor: 'createDataAccessConnections',
      }
    }
  });
}

function missingNodesForLinks(arr) {
  const missing = [];
  const ids = new Set(arr.map((el) => el.id).filter(onlyUnique));

  function check(id) {
    if (!ids.has(id)) {
      let layer = '';
      if (id.match(/^compute/)) {
        layer = 'compute';
      } else if (id.match(/^data/)) {
        layer = 'data';
      } else {
        throw new Error('Unmatched layer ' + id);
      }

      missing.push({
        id,
        layer,
        label: `(missing) ${id}`,
        attrs: {
          type: 'missing'
        }
      });
    }
  }

  arr.forEach((el) => {
    switch (el.layer) {
      case 'data_access':
        check(el.source);
        el.targets.forEach(check);
        break;
      case 'data_link':
        el.nodes.forEach(check);
        break;
      default:
      // console.log('Skupping ', el.layer);
    }
  });

  return mergeElements(missing);
}

module.exports = {
  toId,
  tableId,
  mergeElements,
  buildTableVariations,
  buildTableVariationsFromCamelCase,
  createDataAccessConnections,
  extractAll,
  onlyUnique,
  componentId,
  summary,
  pluralise,
  missingNodesForLinks
};
