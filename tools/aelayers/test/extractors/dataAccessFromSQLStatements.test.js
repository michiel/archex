const dataAccessFromSQLStatements = require('../../src/extractors/dataAccessFromSQLStatements');

xtest('extract data access from sql statements - sample 001', () => {

  const sample = `

  # Random comments

  SELECT
  GROUP_CONCAT(DISTINCT c.Id) INTO counterIds
  FROM (
    SELECT
    cccc.testId
    FROM mydb.item_run itr
    INNER JOIN mydb.item ib ON itr.itemId = ib.Id
    INNER JOIN mydb.item_limit cccc ON ib.locId = cccc.locId AND ib.def = cccc.def
    WHERE
    itr.MaintaskRunId = inMaintaskRunId
    AND itr.Type = 'itemLoad'
    UNION
    SELECT IFNULL(iba.testId, itr.testId) AS testId
    FROM mydb.item_run itr
    LEFT JOIN mydb.item_area iba ON itr.itemArea = iba.Area AND itr.itemId = iba.itemId
    WHERE
    itr.MaintaskRunId = inMaintaskRunId
  ) wrappers
  INNER JOIN mydb.wrapper c ON c.Id = wrappers.testId
  INNER JOIN mydb.wrapper_type ct ON ct.Id = c.Type AND ct.SubType <=> c.SubType # <=> is a NULL-safe comparer
  WHERE ct.isBoH IS TRUE AND ct.MaintaskEnabled IS TRUE;
  `;

  const res = dataAccessFromSQLStatements([sample]);
  expect(res.length).toBe(1);

  let item = res[0];
  expect(item.targets).toEqual([
    'data_unknown_table_item_run',
    'data_unknown_table_item',
    'data_unknown_table_item_limit',
    'data_unknown_table_item_area',
    'data_unknown_table_wrapper',
    'data_unknown_table_wrapper_type'
  ]);

});

