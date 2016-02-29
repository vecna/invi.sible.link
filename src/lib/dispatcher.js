import Bacon from 'baconjs';

export default () => {
  const busCache = {};

  const bus = (name) => busCache[name] = busCache[name] || new Bacon.Bus();

  return {
    stream: (name) => bus(name),
    push: (name, value) => bus(name).push(value),
    plug: (name, value) => bus(name).plug(value),
  }
}
