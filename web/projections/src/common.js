import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import * as dat from 'dat.gui';

const palette = [
  '#9B5DE5',
  '#F15BB5',
  '#FEE440',
  '#00BBF9',
  '#00F5D4',
  //
  // next
  //
  '#EF476F',
  '#FFD166',
  '#06D6A0',
  '#118AB2',
  '#073B4C'
];

const gData = window.graphData;

const getRandom = (max = 20) => {
  return Math.floor(Math.random() * max);
};

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function getGraphProperties(gData) {
  const linkLayers = gData.links.map((n) => n.layer).filter(onlyUnique);
  const nodeLayers = gData.nodes.map((n) => n.layer).filter(onlyUnique);
  const allLayers = linkLayers.concat(nodeLayers);

  const props = {};
  allLayers.forEach((l) => (props[l] = { types: [] }));

  function ex(el) {
    const val = el.attrs.type;
    if (val) {
      const arr = props[el.layer].types;
      if (arr.indexOf(val) < 0) {
        arr.push(val);
      }
    }
  }

  gData.nodes.forEach(ex);
  gData.links.forEach(ex);

  return props;
}

function getLinkLayers(gData) {
  return gData.links.map((n) => n.layer).filter(onlyUnique);
}

function getNodeLayers(gData) {
  return gData.nodes.map((n) => n.layer).filter(onlyUnique);
}

function getLayers(gData) {
  return gData.nodes
    .map((n) => n.layer)
    .concat(gData.links.map((n) => n.layer))
    .filter(onlyUnique);
}

function builder(BuilderFn) {
  const startDistance = 125;
  const maxDistance = 1750;

  const linkLayers = getLinkLayers(window.graphData);
  const nodeLayers = getNodeLayers(window.graphData);
  const layers = nodeLayers.concat(linkLayers);
  const layerProps = getGraphProperties(window.graphData);

  //Define GUI
  const Settings = function () {
    this.cameraDistance = 700;
    this.cameraSpeed = 50;
    this.cameraAngle = 0;

    linkLayers.forEach((layer) => {
      const label = `${layer}Distance`;
      this[label] = startDistance;
    });

    layers.forEach((layer) => {
      const label = `show_${layer}`;
      this[label] = true;
    });

    let i = 0;
    for (let l in layerProps) {
      const types = layerProps[l].types;
      types.forEach((t) => {
        this[`${t}_${l}_size`] = 0;
        this[`${t}_${l}_show`] = true;
        this[`${t}_${l}_color`] = palette[i];
      });
      i++;
    }

    this.rotateCamera = false;
    this.rotateX = true;
    this.rotateY = false;
    this.rotateZ = true;

    this.showArrows = false;
    this.arrowLength = 3.5;

    this.useParticles = false;

    this.labelSize = 8;
  };

  const settings = new Settings();
  const gui = new dat.GUI({
    load: window.visualizationSettings
  });
  gui.remember(settings);

  let folder = gui.addFolder('Link distances');
  linkLayers.forEach((layer) => {
    const label = `${layer}Distance`;
    folder.add(settings, label, 0, maxDistance).onChange(updateLinkDistance);
  });

  folder = gui.addFolder('Camera');

  folder.add(settings, 'cameraDistance', 0, 2500).onChange(updateCameraPosition);
  folder.add(settings, 'cameraSpeed', 5, 100).onChange(updateCameraSpeed);
  folder.add(settings, 'rotateCamera').onChange(updateCameraRotation);
  folder.add(settings, 'rotateX').onChange(updateCameraPosition);
  folder.add(settings, 'rotateY').onChange(updateCameraPosition);
  folder.add(settings, 'rotateZ').onChange(updateCameraPosition);

  folder = gui.addFolder('Styling');
  const controllerLabelSizeNormal = folder.add(settings, 'labelSize', 5, 100);

  folder.add(settings, 'useParticles').onChange(updateGraph);
  folder.add(settings, 'showArrows').onChange(updateGraph);
  folder.add(settings, 'arrowLength', 1, 15).onChange(updateGraph);

  folder = gui.addFolder('Layers');

  layers.forEach((layer) => {
    const label = `show_${layer}`;
    folder.add(settings, label).onChange(showLayers);
  });

  for (let l in layerProps) {
    let subfolder = folder.addFolder(`Layer - ${l}`);
    const types = layerProps[l].types;
    types.forEach((t) => {
      subfolder.add(settings, `${t}_${l}_show`).onChange(showLayers);
      subfolder.addColor(settings, `${t}_${l}_color`).onChange(showLayers);
      subfolder.add(settings, `${t}_${l}_size`, 0, 50).onChange(updateSizes);
    });
  }

  gui.close();

  controllerLabelSizeNormal.onChange(updateNodes);
  // controllerLabelSizeRoot.onChange(updateNodes);

  function getColor(el) {
    return settings[`${el.attrs.type}_${el.layer}_color`];
  }

  // const graph = BuilderFn({ controlType: 'fly' })
  const graph = BuilderFn()(document.getElementById('3d-graph'))
    .nodeLabel((node) => node.name)
    // .nodeVal(node => node.name)
    .nodeColor(getColor)
    .linkColor(getColor)
    // .nodeColor(node => node.color ? node.color : 'pink' )
    // .linkColor(link => link.color ? link.color : 'pink' )
    .linkOpacity(0.5)
    .linkDirectionalParticles(settings.useParticles ? 1 : 0)
    .linkDirectionalParticleSpeed(0.001)
    .linkDirectionalArrowLength(settings.showArrows ? settings.arrowLength : 0)
    .linkDirectionalArrowRelPos(1)
    // .nodeThreeObject(buildNodeObject)
    .enableNavigationControls(!settings.rotateCamera)
    .showNavInfo(!settings.rotateCamera)
    .cameraPosition({ z: settings.cameraDistance })
    .onNodeClick(focusNode)
    .graphData(gData);

  function getNodeColor(node) {}

  function buildNodeObject(node) {
    // use a sphere as a drag handle
    const obj = new THREE.Mesh(
      new THREE.SphereGeometry(10),
      new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 })
    );
    // add text sprite as child
    const sprite = new SpriteText(node.name);
    sprite.color = node.color; // (node.type === 'root') ? node.color : settings.labelColour;
    sprite.textHeight = settings.labelSize; // (node.type === 'root') ? settings.rootLabelSize : settings.labelSize;
    obj.add(sprite);
    return obj;
  }

  function showLayers() {
    let { nodes, links } = window.graphData; // graph.graphData();
    const visibleLayers = layers.filter((layer) => {
      return settings[`show_${layer}`];
    });

    nodes = nodes.filter((node) => {
      if (visibleLayers.indexOf(node.layer) < 0) {
        links = links.filter((l) => l.source !== node && l.target !== node);
        return false;
      } else {
        if (settings[`${node.attrs.type}_${node.layer}_show`] === false) {
          links = links.filter((l) => l.source !== node && l.target !== node);
          return false;
        } else {
          return true;
        }
      }
    });
    links = links.filter((l) => {
      if (visibleLayers.indexOf(l.layer) > 0) {
        if (settings[`${l.attrs.type}_${l.layer}_show`] === false) {
          return false;
        } else {
          return true;
        }
      } else {
        return false;
      }
    });

    graph.graphData({ nodes, links });
  }

  function focusNode(node) {
    stopCameraRotation();
    // Aim at node from outside it
    const distance = 250;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

    graph.cameraPosition(
      { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
      node, // lookAt ({ x, y, z })
      3000 // ms transition duration
    );
  }

  function updateSizes() {
    // graph.nodeRelSize(el=> parseInt(settings[`${el.attrs.type}_${el.layer}_size`]));
    graph.linkWidth((el) => settings[`${el.attrs.type}_${el.layer}_size`]);
  }

  function updateNodes() {
    graph.nodeThreeObject(buildNodeObject);
  }

  let angle = 0;
  let interval;

  const rotateCamera = () => {
    if (!settings.rotateCamera) {
      return;
    }
    updateCameraPosition();
    // angle = (angle % 360) + Math.PI / 300;
    angle += Math.PI / 300;
  };

  function updateCameraSpeed() {
    stopCameraRotation();
    startCameraRotation();
  }

  function updateCameraPosition() {
    let pos = {};

    if (settings.rotateX) {
      pos.x = settings.cameraDistance * Math.sin(angle);
    }

    if (settings.rotateY) {
      pos.y = settings.cameraDistance * Math.sin(angle);
    }

    if (settings.rotateZ) {
      pos.z = settings.cameraDistance * Math.cos(angle);
    }

    graph.cameraPosition(pos);
  }

  const stopCameraRotation = () => {
    interval && clearInterval(interval);
    graph.enableNavigationControls(true);
    graph.showNavInfo(true);
  };

  const startCameraRotation = () => {
    stopCameraRotation();
    if (settings.rotateCamera) {
      interval = setInterval(rotateCamera, settings.cameraSpeed);
      graph.enableNavigationControls(false);
      graph.showNavInfo(false);
    }
  };

  startCameraRotation();

  const distanceForLayer = (link) => {
    const label = `${link.layer}Distance`;
    if (settings[label]) {
      return settings[label];
    } else {
      return startDistance;
    }
  };

  const linkForce = graph.d3Force('link').distance(distanceForLayer);

  function updateCameraRotation() {
    startCameraRotation();
  }

  function updateLinkDistance() {
    linkForce.distance(distanceForLayer);
    graph.numDimensions(5); // Re-heat simulation
  }

  function updateGraph() {
    graph.linkDirectionalArrowLength(settings.showArrows ? settings.arrowLength : 0);
    graph.linkDirectionalParticles(settings.useParticles ? 1 : 0);
    graph.linkDirectionalParticleWith(settings.particleWidth);
  }

  console.log(gui.getSaveObject());
}

export { builder };
