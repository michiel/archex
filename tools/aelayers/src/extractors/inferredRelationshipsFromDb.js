const knex = require('knex');
const schemaInspector = require('knex-schema-inspector').default;

const { toId, tableId, buildTableVariationsFromCamelCase } = require('../util');

/*
{
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'your_database_user',
    password: 'your_database_password',
    database: 'myapp_test',
    charset: 'utf8',
  },
}
*/

const defaultConfig = {
  skipUnknown: true
};

async function extractor(knexParams, config = defaultConfig) {
  const database = knex(knexParams);
  const inspector = schemaInspector(database);

  const tables = await inspector.tables();
  const columns = await inspector.columns();
  const databaseName = knexParams.connection.database;

  let res = [];
  const regex = /._?id$/i;
  const regexReplace = /_?id$/i;

  columns.forEach((el) => {
    if (el.column.match(regex)) {
      let table = el.column.replace(regexReplace, '');
      let tableVariations = buildTableVariationsFromCamelCase(table);
      let tableMatch = tableVariations.filter((t) => {
        return tables.indexOf(t) > -1;
      });

      if (tableMatch.length > 0) {
        const foundTable = tableMatch[0];
        res.push({
          id: toId(`data_link_${databaseName}_${el.table}_${el.column}`),
          label: `${el.column}`,
          layer: 'data_link',
          nodes: [tableId(databaseName, foundTable), tableId(databaseName, el.table)],
          attrs: {
            type: 'DatabaseRelationship',
            database: databaseName,
            extractor: 'inferredRelationshipsFromDb'
          }
        });
      } else if (!config.skipUnknown) {
        res.push({
          id: toId(`data_link_${databaseName}_${el.table}_${el.column}`),
          label: `${el.column}`,
          layer: 'data_link',
          nodes: [tableId(databaseName, table), toId('unknown-relationship')],
          attrs: {
            type: 'DatabaseRelationship',
            database: databaseName,
            extractor: 'inferredRelationshipsFromDb'
          }
        });
      }
    }
  });

  return res;
}

module.exports = extractor;
