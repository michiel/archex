const colorNames = ['red', 'green', 'blue', 'yellow', 'purple', 'white'];

const getRandom = (max=20) => {
  return Math.floor(Math.random() * max);
}

const pickRandom = (arr) => {
  return arr[
    getRandom(arr.length - 1)
  ];
}

let actorNumber = getRandom(20) + 2;
let actorNames = [];
for (let i=0; i<actorNumber; i++) {
  actorNames.push(`Actor_${i}`);
}

let colors = {};
actorNames.forEach(name => {
  colors[name] = pickRandom(colorNames);
});

let attributeNumber = getRandom(50) + 2;
let attributeNames = [];
for (let i=0; i<attributeNumber; i++) {
  attributeNames.push(`Attribute_${i}`);
}

let visData = {};
actorNames.forEach(name => {
  let res = [];
  for (let i=0; i<getRandom(40); i++) {
    res.push(pickRandom(attributeNames));
  }
  visData[name] = res;
});

window.visualizationSettings = { };
window.visualizationDataSettings = {
  colors: colors,
};

window.visualizationData = visData;

