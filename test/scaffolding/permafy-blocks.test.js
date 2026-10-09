import registerPermafyBlocks from '../../src/scaffolding/permafy-blocks';

const createVM = () => {
  const listeners = {};
  const thread = {play: jest.fn()};
  const vm = {
    pause: jest.fn(),
    play: jest.fn(),
    runtime: {
      _hats: {},
      _primitives: {
        sensing_askandwait: jest.fn()
      },
      on: (event, callback) => {
        listeners[event] = callback;
      },
      startHats: jest.fn(() => [thread])
    }
  };
  return {vm, listeners, thread};
};

test('registers pause and resume controls with matching hats', () => {
  const {vm, thread} = createVM();
  registerPermafyBlocks(vm);

  vm.runtime._primitives.control_pause();
  expect(vm.pause).toHaveBeenCalledTimes(1);
  expect(vm.runtime.startHats).toHaveBeenCalledWith('event_whenpausebuttonclicked');
  expect(thread.play).toHaveBeenCalledTimes(1);

  vm.runtime._primitives.control_resume();
  expect(vm.play).toHaveBeenCalledTimes(1);
  expect(vm.runtime.startHats).toHaveBeenCalledWith('event_whenplaybuttonclicked');
});

test('stores data locally and exposes the last question', async () => {
  const values = new Map();
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      removeItem: key => values.delete(key),
      setItem: (key, value) => values.set(key, String(value))
    }
  });
  const {vm, listeners} = createVM();
  registerPermafyBlocks(vm);

  await vm.runtime._primitives.sensing_savedata({NAME: 'score', VALUE: '42'});
  expect(await vm.runtime._primitives.sensing_getdata({NAME: 'score'})).toBe('42');
  await vm.runtime._primitives.sensing_savedata({NAME: 'score', VALUE: ''});
  expect(await vm.runtime._primitives.sensing_getdata({NAME: 'score'})).toBe('');

  vm.runtime._primitives.sensing_askandwait({QUESTION: 'Ready?'}, {});
  expect(vm.runtime._primitives.sensing_question()).toBe('Ready?');
  listeners.PROJECT_START();
  expect(vm.runtime._primitives.sensing_question()).toBe('');
  delete global.localStorage;
});

test('registers timestamp and cached clipboard primitives', async () => {
  const {vm} = createVM();
  registerPermafyBlocks(vm);

  expect(vm.runtime._primitives.sensing_unix()).toBe(Math.floor(Date.now() / 1000));
  await vm.runtime._primitives.sensing_setclipboard({ITEM: 'copied'});
  expect(await vm.runtime._primitives.sensing_getclipboard()).toBe('copied');
});