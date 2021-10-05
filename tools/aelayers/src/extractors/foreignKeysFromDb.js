const knex = require('knex');
const schemaInspector = require('knex-schema-inspector').default;

const { toId, tableId } = require('../util');

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

async function extractor(knexParams) {
  const database = knex(knexParams);
  const inspector = schemaInspector(database);

  const foreignKeys = await inspector.foreignKeys();
  const databaseName = knexParams.connection.database;

  return foreignKeys.map((fk) => {
    return {
      id: toId(`data_link_${databaseName}_${fk.constraint_name}`),
      label: `${fk.constraint_name}`,
      layer: 'data_link',
      source: tableId(databaseName, fk.table),
      target: tableId(databaseName, fk.foreign_key_table),
      attrs: {
        type: 'DatabaseForeignKey',
        database: databaseName,
        extractor: 'foreignKeysFromDb'
      }
    };
  });
}

module.exports = extractor;
