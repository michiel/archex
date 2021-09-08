const layersFromXRay = require('../../src/extractors/layersFromXRay');
const fs = require('fs');
const path = require('path');

test('extract layers from xray service map', () => {
  const serviceMap = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '..', 'data','xray-service-map.json')
    )
  );
  const layers = layersFromXRay(serviceMap, {
    prefixRegex: '^.*-stack-',
  });

  console.error(layers);


});
