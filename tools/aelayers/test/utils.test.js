const utils = require('../src/util');

test('merge elements function basic', () => {
  const arr = [
    {
      id: 1,
      attrs: {
        a: 1,
        b: 2
      }
    },
    {
      id: 1,
      attrs: {
        b: 3,
        c: 4
      }
    }
  ];

  expect(utils.mergeElements(arr)).toEqual([
    {
      id: 1,
      attrs: {
        a: 1,
        b: 3,
        c: 4
      }
    }
  ]);
});

test('merge elements function combined', () => {
  const arr = [
    {
      id: 0,
      attrs: {
        b: 2
      }
    },
    {
      id: 1,
      attrs: {
        a: 1,
        b: 2
      }
    },
    {
      id: 1,
      attrs: {
        b: 3,
        c: 4
      }
    }
  ];

  expect(utils.mergeElements(arr)).toEqual([
    {
      id: 0,
      attrs: {
        b: 2
      }
    },
    {
      id: 1,
      attrs: {
        a: 1,
        b: 3,
        c: 4
      }
    }
  ]);
});

test('merge elements function string ids', () => {
  const arr = [
    {
      id: '0',
      attrs: {
        b: 2
      }
    },
    {
      id: '1',
      attrs: {
        a: 1,
        b: 2
      }
    },
    {
      id: '1',
      attrs: {
        b: 3,
        c: 4
      }
    }
  ];

  expect(utils.mergeElements(arr)).toEqual([
    {
      id: '0',
      attrs: {
        b: 2
      }
    },
    {
      id: '1',
      attrs: {
        a: 1,
        b: 3,
        c: 4
      }
    }
  ]);
});

test('table variations from camel case', () => {
  expect(utils.buildTableVariationsFromCamelCase('MyTableName')).toEqual([
    'mytablename',
    'MyTableName',
    'My_Table_Name',
    'My_Table_Name',
    'my_table_name'
  ]);

  expect(utils.buildTableVariationsFromCamelCase('myTableName')).toEqual([
    'mytablename',
    'myTableName',
    'my_Table_Name',
    'My_Table_Name',
    'my_table_name'
  ]);
});
