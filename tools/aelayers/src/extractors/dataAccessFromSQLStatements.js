const { toId, tableId, componentId, onlyUnique, mergeElements } = require('../util');

function componentStubs(das, config) {
  const componentIds = new Set(das.map((el) => el.id).filter(onlyUnique));
  const res = [];
  das.forEach((da) => {
    if (componentIds.has(da.id)) {
      componentIds.delete(da.id);
      res.push({
        id: componentId(config.fnName),
        label: config.fnName,
        layer: 'compute',
        attrs: {
          type: config.componentStubType,
          extractor: 'dataAccessFromSQLStatements'
        }
      });
    }
  });
  // return mergeElements(res);
  return res;
}

function summToLayer(summ, config, id = 0) {
  return {
    id: toId(`data_access_${config.dbName}_${config.fnName}_${id}`),
    label: `Access ${config.fnName} ${id}`,
    layer: 'data_access',
    source: componentId(config.fnName),
    targets: summ.tables.map((t) => tableId(config.dbName, t)).filter(onlyUnique),
    attrs: {
      type: 'DatabaseAccess',
      database: config.dbName,
      extractor: 'dataAccessFromSQLStatements',
      querytype: summ.type,
      query: summ.query
    }
  };
}

const defaultConfig = {
  fnName: 'unknown',
  dbName: 'unknown',
  generateComponentStubs: false,
  componentStubType: 'unknown'
};

function extractor(statements, config = defaultConfig) {
  const relationships = [];
  statements.forEach((statement) => {
    const summ = {
      type: 'OTHER',
      tables: [],
      query: statement
    };

    function addTable(table) {
      table = table.replace(/[\'"]/, '');
      table = table.replace(/\(.*/, '');
      table = table.replace(/\).*/, '');
      table = table.replace(/\s.*/, '');
      table = table.replace(/.+\./, '');
      // console.log('TABLE ', table);
      if (table.match(/[\(A-Z]/)) {
        // skip
      } else if (table.match(/1/)) {
        // skip
      } else if (table.match(/^\s+$/)) {
        // skip
      } else if (table.length < 2) {
        // skip
      } else {
        summ.tables.push(table);
      }
    }

    if (statement.match(/SELECT[\s\n\r]/i)) {
      summ.type = 'SELECT';
      const matches = statement.match(/FROM ([^\s\(]+)/gi);
      if (matches) {
        matches.forEach((match) => {
          addTable(match.replace(/FROM /i, ''));
        });
      }

      const joins = statement.match(/JOIN ([^\s\(]+)/gi);
      if (joins) {
        joins.forEach((match) => {
          addTable(match.replace(/JOIN /i, ''));
        });
      }
    }
    if (statement.match(/UPDATE /i)) {
      if (statement.match(/IN DUPLICATE KEY UPDATE /i)) {
        // skip
      } else {
        summ.type = 'UPDATE';
        let t = statement.replace(/.*UPDATE /i, '');
        addTable(t);
      }
    }

    if (statement.match(/INSERT (IGNORE )?INTO/i)) {
      summ.type = 'INSERT';
      let t = statement.replace(/.*INSERT (IGNORE )?INTO /i, '');
      t = t.replace(/\(.*/, '');
      t = t.replace(/\s.*/, '');
      addTable(t);
    }

    if (statement.match(/DELETE /i)) {
      summ.type = 'DELETE';
      const matches = statement.match(/FROM ([^\s\(]+)/i);
      if (matches) {
        // console.log(matches);
        matches.forEach((match) => {
          addTable(match.replace(/FROM /i, ''));
        });
      }
    }

    if (statement.match(/CREATE TEMPORARY TABLE /i)) {
      summ.type = 'CREATE';
      const matches = statement.match(/CREATE TEMPORARY TABLE ([^\s\(\"]+)/i);
      if (matches) {
        // console.log(matches);
        matches.forEach((match) => {
          let table = match.replace(/CREATE TEMPORARY TABLE /i, '');
          addTable(table);
        });
      }
    }

    if (summ.tables.length !== 0) {
      relationships.push(summToLayer(summ, config, relationships.length));
    }
  });

  if (config.generateComponentStubs) {
    return relationships.concat(componentStubs(relationships, config));
  } else {
    // console.log('mf');
    // console.log(relationships);
    return relationships;
  }
}

module.exports = extractor;
