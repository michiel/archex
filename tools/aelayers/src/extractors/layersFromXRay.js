const { toId } = require('../util');

const defaultConfig = {
  prefixRegex: '^[^-]*-dev-',
};


function getName(service, config) {
  const prefixRegex = new RegExp(config.prefixRegex);
  let name = service.Name;

  if (service.Type === 'AWS::SQS::Queue') {
    name = name.replace(/http.*\//, '');
  } else if (service.Type === 'AWS::DynamoDB::Table') {
    name = name.replace(/.*-ap-southeast-2-/, '');
  }

  name = name.replace(prefixRegex, '');

  return name;
}

function extractLayerInfo(idMap) {
  let layerId = {};
  for (let id in idMap) {
    const entry = idMap[id];
    if (
      (entry.awstype === 'remote') ||
      (entry.awstype === 'AWS::KinesisFirehose') ||
      (entry.awstype === 'AWS::DynamoDB::Table') ||
      (entry.awstype === 'AWS::secretsmanager') ||
      (entry.awstype === 'AWS::SQS::Queue') ||
      (entry.awstype === 'Database::SQL') ||
      (entry.awstype === 'AWS::SNS') ||
      (entry.awstype === 'AWS::S3')
    ) {
      layerId[id] = ({
        id: toId(`data_${entry.name}`),
        label: `${entry.name}`,
        layer: 'data',
        attrs: {
          type: entry.awstype,
          extractor: 'layersFromXRay',
        }
      });
    } else if (
      (entry.awstype === 'client') ||
      (entry.awstype === 'custom-compute') ||
      (entry.awstype === 'AWS::stepfunctions') ||
      (entry.awstype === 'AWS::StepFunctions::StateMachine') ||
      (entry.awstype === 'AWS::EC2::Instance') ||
      (entry.awstype === 'AWS::Lambda::Function')
    ) {
      layerId[id] = ({
        id: toId(`compute_${entry.name}`),
        label: `${entry.name}`,
        layer: 'compute',
        attrs: {
          type: entry.awstype,
          extractor: 'layersFromXRay',
        }
      });
    } else {
      throw new Error('Unhandled awstype ' + JSON.stringify(entry));
    }
  }
  return layerId;
}

function generateLinks(layerInfo, idMap) {
  let links = [];
  for (let id in layerInfo) {
    const entry = layerInfo[id];

    if (entry.layer === 'compute') {
      idMap[id].sources.forEach(s => {
        if (s === entry.id) {
          return;
        }
        let sentry = layerInfo[s];
        if (sentry.layer === 'compute') {
          links.push({
            id: `compute_link_${sentry.id}_${entry.id}_${s}`,
            label: `Access ${entry.id}`,
            layer: 'compute_link',
            source: sentry.id,
            target: entry.id,
            attrs: {
              extractor: 'layersFromXRay',
            }
          });
        }
      });

      idMap[id].targets.forEach(t => {
        if (t === entry.id) {
          return;
        }
        let tentry = layerInfo[t];
        if (tentry.layer === 'compute') {
          links.push({
            id: `compute_link_${entry.id}_${tentry.id}_${t}`,
            label: `Access ${tentry.id}`,
            layer: 'compute_link',
            source: entry.id,
            target: tentry.id,
            attrs: {
              extractor: 'layersFromXRay',
            }
          });
        } else if (tentry.layer === 'data') {

          links.push({
            id: `data_access_${entry.id}_${tentry.id}_${t}`,
            label: `Access ${tentry.id}`,
            layer: 'data_access',
            source: entry.id,
            targets: [tentry.id],
            attrs: {
              extractor: 'layersFromXRay',
            }
          });
        } else {
          throw new Error('Unhandled layer ' + JSON.stringify(sentry));
        }
      });
    }
  }
  return links;
}

function getEdges(service) {
  return service.Edges.map(edge=> String(edge.ReferenceId));
}

function reduceMap(idMap) {
  for (let id in idMap) {
    const entry = idMap[id];
    if (
      (entry.awstype === 'AWS::Lambda') ||
      (entry.awstype === 'AWS::ApiGateway::Stage')
    )
    {

      for (let tid in idMap) {
        const tentry = idMap[tid];
        let idx = tentry.sources.indexOf(id);
        if (idx > -1) {
          // remove myself from target entry sources
          idMap[tid].sources.splice(idx, 1);

          // add my sources to target entry sources
          idMap[tid].sources = idMap[tid].sources.concat(entry.sources);
        }
      }

      entry.sources.forEach(sid=> {
        const sentry = idMap[sid];
        let idx = sentry.targets.indexOf(id);
        if (idx > -1) {
          // remove myself from target entry sources
          idMap[sid].targets.splice(idx, 1);

          // add my sources to target entry sources
          idMap[sid].targets = idMap[sid].targets.concat(entry.targets);
        }
      });


      delete idMap[id];
    }
  }
  return idMap;
}

function extractor(serviceMap, config=defaultConfig) {
  let idMap = { };
  serviceMap.Services.forEach(service=> {
    idMap[String(service.ReferenceId)] = {
      xrayid: String(service.ReferenceId),
      awstype: service.Type || 'custom-compute', // user instrumented
      name: getName(service, config),
      targets: getEdges(service),
      sources: [],
    };
  });

  for (let id in idMap) {
    const entry = idMap[id];
    for (let tid in idMap) {
      const tentry = idMap[tid];
      if (tentry.targets.indexOf(id) > -1) {
        idMap[id].sources.push(tid);
      }
    }
  }

  idMap = reduceMap(idMap);
  layerInfo = extractLayerInfo(idMap);
  links = generateLinks(layerInfo, idMap);
  return links.concat(
    Object.entries(layerInfo)
    .map(([k,v])=> v));
}

module.exports = extractor;
