const defaultConfig = {
  prefixRegex: '^[^-]*-dev-',
};


function getName(service, config) {
  const prefixRegex = new RegExp(config.prefixRegex);

  if (service.Type === 'AWS::Lambda') {
    return service.Name.replace(prefixRegex, '');
  } else if (service.Type === 'AWS::Lambda::Function') {
    return (service.Name.replace(prefixRegex, ''));
  } else if (service.Type === 'AWS::SQS::Queue') {
    return service.Name.replace(/http.*\//, '').replace(prefixRegex, '');
  } else if (service.Type === 'AWS::DynamoDB::Table') {
    return service.Name.replace(/.*-ap-southeast-2-/, '');
  } else {
    return service.Name;
  }
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
      awstype: service.Type,
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
  return idMap;
}

module.exports = extractor;
