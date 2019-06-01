import { expect } from 'chai';
import { DebugConfiguration } from '../../../debug/src/index';
import { BasicConfiguration } from '../../../jit-html-browser/src/index';
import { Aurelia, CustomElementResource } from '../../../runtime/src/index';
import { Router, ViewportCustomElement, RouterConfiguration } from '../../src/index';
import { MockBrowserHistoryLocation } from '../mock/browser-history-location.mock';
import { ViewportInstruction } from './../../src/viewport-instruction';

describe('InstructionResolver', function () {
  this.timeout(30000);
  it('can be created', async function () {
    const { host, router } = await setup();
    await waitForNavigation(router);

    await teardown(host, router);
  });

  it('handles state strings', async function () {
    const { host, router } = await setup();
    await waitForNavigation(router);

    let instructions: ViewportInstruction[] = [
      new ViewportInstruction('foo', 'left', '123'),
      new ViewportInstruction('bar', 'right', '456'),
    ];
    let instructionsString = router.instructionResolver.stringifyViewportInstructions(instructions);
    expect(instructionsString).to.equal('foo@left(123)+bar@right(456)');
    let newInstructions = router.instructionResolver.parseViewportInstructions(instructionsString);
    expect(newInstructions).to.deep.equal(instructions);

    instructions = [
      new ViewportInstruction('foo', undefined, '123'),
      new ViewportInstruction('bar', 'right'),
      new ViewportInstruction('baz'),
    ];
    instructionsString = router.instructionResolver.stringifyViewportInstructions(instructions);
    expect(instructionsString).to.equal('foo(123)+bar@right+baz');
    newInstructions = router.instructionResolver.parseViewportInstructions(instructionsString);
    expect(newInstructions).to.deep.equal(instructions);

    await teardown(host, router);
  });

  interface InstructionTest {
    instruction: string;
    viewportInstruction: ViewportInstruction;
  }

  const instructions: InstructionTest[] = [
    { instruction: 'foo', viewportInstruction: new ViewportInstruction('foo') },
    { instruction: 'foo@left', viewportInstruction: new ViewportInstruction('foo', 'left') },
    { instruction: 'foo@left(123)', viewportInstruction: new ViewportInstruction('foo', 'left', '123') },
    { instruction: 'foo(123)', viewportInstruction: new ViewportInstruction('foo', undefined, '123') },
    { instruction: 'foo/bar', viewportInstruction: new ViewportInstruction('foo', undefined, undefined, false, new ViewportInstruction('bar')) },
    { instruction: 'foo(123)/bar@left/baz', viewportInstruction: new ViewportInstruction('foo', undefined, '123', false, new ViewportInstruction('bar', 'left', undefined, false, new ViewportInstruction('baz'))) },
  ];

  for (const instructionTest of instructions) {
    const { instruction, viewportInstruction } = instructionTest;

    it(`parses viewport instruction: ${instruction}`, async function () {
      const { host, router } = await setup();
      await waitForNavigation(router);

      const parsed = router.instructionResolver.parseViewportInstruction(instruction);
      expect(parsed).to.deep.equal(viewportInstruction);
      const newInstruction = router.instructionResolver.stringifyViewportInstruction(parsed);
      expect(newInstruction).to.equal(instruction);

      await teardown(host, router);
    });
  }
});

const setup = async (): Promise<{ au; container; host; router }> => {
  const container = BasicConfiguration.createContainer();

  const App = (CustomElementResource as any).define({ name: 'app', template: '<template><au-viewport name="left"></au-viewport><au-viewport name="right"></au-viewport></template>' });
  container.register(Router as any);
  container.register(ViewportCustomElement as any);

  const host = document.createElement('div');
  document.body.appendChild(host as any);

  const au = window['au'] = new Aurelia(container)
    .register(DebugConfiguration, RouterConfiguration)
    .app({ host: host, component: App })
    .start();

  const router = container.get(Router);
  const mockBrowserHistoryLocation = new MockBrowserHistoryLocation();
  mockBrowserHistoryLocation.changeCallback = router.navigation.handlePopstate as any;
  router.navigation.history = mockBrowserHistoryLocation as any;
  router.navigation.location = mockBrowserHistoryLocation as any;

  await router.activate();
  return { au, container, host, router };
};

const teardown = async (host, router) => {
  document.body.removeChild(host);
  router.deactivate();
};

const wait = async (time = 500) => {
  await new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

const waitForNavigation = async (router) => {
  let guard = 100;
  while (router.processingNavigation && guard--) {
    await wait(100);
  }
};
