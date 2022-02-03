const draw = (data, targetEl) => {
  const { objects, duration: sequenceDuration } = data;

  const createItemEl = (item, objectId, index) => {
    const { start, duration, type, source } = item;
    const el = document.createElement('div');
    el.classList.add('item');
    el.classList.add(source.type);
    el.style.left = `${(start / sequenceDuration) * 100}%`;
    el.style.width = `${(duration / sequenceDuration) * 100}%`;
    el.title = `object\t\t${objectId}\nitem\t\t${index}\n\nstart\t\t${start}\nduration\t${duration}\ntype\t\t${source.type}\nurl\t\t${source.url}`;
    el.tabIndex = 0;
    return el;
  };

  objects.forEach(({ objectId, items }) => {
    const objectEl = document.createElement('div');
    objectEl.classList.add('object');
    objectEl.title = `object\t\t${objectId}`;

    items.forEach((item, i) => {
      objectEl.appendChild(createItemEl(item, objectId, i));
    });

    targetEl.appendChild(objectEl);
  });
};

const input = document.getElementById('input');
const output = document.getElementById('output');

const objectInfo = document.getElementById('objectInfo');
const itemInfo = document.getElementById('itemInfo');

const redraw = () => {
  output.innerHTML = '';
  try {
    const data = JSON.parse(input.value);
    draw(data, output);
  } catch (e) {
    alert(`Failed to parse sequence data:\n\n${e}`);
  }
};

document.getElementById('redraw').addEventListener('click', redraw);
window.addEventListener('load', redraw);

output.addEventListener('mouseover', (e) => {
  const { target } = e;
  if (target.classList.contains('item')) {
    itemInfo.innerText = target.title;
  } else if (target.classList.contains('object')) {
    objectInfo.innerText = target.title;
  }
});

output.addEventListener('mouseout', (e) => {
  const { target } = e;
  if (target.classList.contains('item')) {
    itemInfo.innerText = '';
  } else if (target.classList.contains('object')) {
    objectInfo.innerText = '';
  }
});

