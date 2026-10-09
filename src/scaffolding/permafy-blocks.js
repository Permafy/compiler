const registerPermafyBlocks = vm => {
  const runtime = vm.runtime;
  if (!runtime || !runtime._primitives || !runtime._hats) return;

  const pauseHat = 'event_whenpausebuttonclicked';
  const playHat = 'event_whenplaybuttonclicked';
  runtime._hats[pauseHat] = runtime._hats[pauseHat] || {restartExistingThreads: true};
  runtime._hats[playHat] = runtime._hats[playHat] || {restartExistingThreads: true};

  const startHat = opcode => runtime.startHats(opcode) || [];
  runtime._primitives.control_pause = () => {
    vm.pause();
    startHat(pauseHat).forEach(thread => thread.play());
  };
  runtime._primitives.control_resume = () => {
    vm.play();
    startHat(playHat);
  };

  runtime._primitives.looks_tutorialmod_alert = async args => {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(args.MESSAGE);
    }
  };
  runtime._primitives.sensing_savedata = async args => {
    const key = `si_ugc_${String(args.NAME)}`;
    try {
      if (typeof localStorage === 'undefined') return;
      if (args.VALUE === '') {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, args.VALUE);
      }
    } catch (error) {
      return;
    }
  };
  runtime._primitives.sensing_getdata = async args => {
    try {
      if (typeof localStorage === 'undefined') return '';
      return localStorage.getItem(`si_ugc_${String(args.NAME)}`) ?? '';
    } catch (error) {
      return '';
    }
  };
  runtime._primitives.sensing_unix = () => Math.floor(Date.now() / 1000);

  runtime._lastQuestion = '';
  const askAndWait = runtime._primitives.sensing_askandwait;
  if (typeof askAndWait === 'function') {
    runtime._primitives.sensing_askandwait = function (args, util) {
      runtime._lastQuestion = String(args.QUESTION);
      return askAndWait.call(this, args, util);
    };
  }
  runtime._primitives.sensing_question = () => runtime._lastQuestion;
  if (typeof runtime.on === 'function') {
    runtime.on('PROJECT_START', () => {
      runtime._lastQuestion = '';
    });
  }

  const clipboardState = {value: '', lastRead: 0};
  runtime._primitives.sensing_setclipboard = async args => {
    clipboardState.value = String(args.ITEM);
    const clipboard = typeof navigator === 'undefined' ? null : navigator.clipboard;
    if (!clipboard || typeof clipboard.writeText !== 'function') return;
    try {
      await clipboard.writeText(clipboardState.value);
    } catch (error) {
      return;
    }
  };
  runtime._primitives.sensing_getclipboard = async () => {
    const clipboard = typeof navigator === 'undefined' ? null : navigator.clipboard;
    if (!clipboard || typeof clipboard.readText !== 'function') return clipboardState.value;
    if (Date.now() - clipboardState.lastRead < 250) return clipboardState.value;
    clipboardState.lastRead = Date.now();
    try {
      clipboardState.value = await clipboard.readText();
    } catch (error) {
      return clipboardState.value;
    }
    return clipboardState.value;
  };
};

export default registerPermafyBlocks;