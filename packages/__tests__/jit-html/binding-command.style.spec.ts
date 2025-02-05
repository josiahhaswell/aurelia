import { Constructable } from '@aurelia/kernel';
import { Aurelia, CustomElementResource, ILifecycle, LifecycleFlags } from '@aurelia/runtime';
import { IEventManager } from '@aurelia/runtime-html';
import { BasicConfiguration } from '@aurelia/jit-html';
import { TestContext, eachCartesianJoin, assert } from '@aurelia/testing';

// TemplateCompiler - Binding Commands integration
describe('template-compiler.binding-commands.style', () => {

  /** [ruleName, ruleValue, defaultValue, isInvalid, valueOnInvalid] */
  const rulesTests: [string, string, string, boolean?, string?][] = [
    ['background', 'red', ''],
    ['color', 'red', ''],
    ['background-color', 'red', ''],
    ['font-size', '10px', ''],
    ['font-family', 'Arial', ''],
    ['-webkit-user-select', 'none', ''],
    ['--customprop', 'red', ''],
    ['background', 'red!important', ''],
    ['--custumprop', 'nah!important', ''],
    // non happy path
    ['-webkit-user-select', 'of course', '', true, ''],
  ];

  const testCases: ITestCase[] = [
    {
      selector: 'button',
      title: (ruleName: string, ruleValue: string, callIndex: number) => `${callIndex}. ${ruleName}=${ruleValue}`,
      template: (ruleTest) => {
        return `
        <button ${ruleTest}.style="value"></button>
        <button style.${ruleTest}="value"></button>
        <child value.bind="value"></child>
        <child repeat.for="i of 5" value.bind="value"></child>`;
      },
      assert: async (au, lifecycle, host, component, [ruleName, ruleValue, ruleDefaultValue, isInvalid, valueOnInvalid], testCase) => {
        const childEls = host.querySelectorAll('child') as ArrayLike<HTMLElement>;
        const hasImportant = ruleValue.indexOf('!important') > -1;
        const ruleValueNoPriority = hasImportant ? ruleValue.replace('!important', '') : ruleValue;

        assert.strictEqual(childEls.length, 6, `childEls.length`);

        component.value = ruleValue;

        lifecycle.processRAFQueue(LifecycleFlags.none);

        for (let i = 0, ii = childEls.length; ii > i; ++i) {
          const child = childEls[i];
          assert.strictEqual(
            child.style.getPropertyValue(ruleName),
            isInvalid ? valueOnInvalid : ruleValueNoPriority,
            `[${ruleName}]component.value="${ruleValue}" 1`
          );
          if (hasImportant) {
            assert.strictEqual(child.style.getPropertyPriority(ruleName), 'important', `child.style.getPropertyPriority(ruleName)`);
          }
        }

        component.value = '';

        lifecycle.processRAFQueue(LifecycleFlags.none);

        for (let i = 0, ii = childEls.length; ii > i; ++i) {
          const child = childEls[i];
          assert.strictEqual(child.style.getPropertyValue(ruleName), ruleDefaultValue, `[${ruleName}]component.value="" 1`);
          if (hasImportant) {
            assert.strictEqual(
              child.style.getPropertyPriority(ruleName),
              '',
              `!important[${ruleName}]vm.value="" 1`
            );
          }
        }

        component.value = ruleValue;

        lifecycle.processRAFQueue(LifecycleFlags.none);

        for (let i = 0, ii = childEls.length; ii > i; ++i) {
          const child = childEls[i];
          assert.strictEqual(
            child.style.getPropertyValue(ruleName),
            isInvalid ? valueOnInvalid : ruleValueNoPriority,
            `[${ruleName}]component.value="${ruleValue}" 2`
          );
          if (hasImportant) {
            assert.strictEqual(
              child.style.getPropertyPriority(ruleName),
              'important',
              `!important[${ruleName}]component.value=${ruleValue} 2`
            );
          }
        }

        // TODO: for inlined css, there are rules that employs fallback value when incoming value is inappropriate
        //        better test those scenarios
      }
    }
  ];

  /**
   * For each combination of style rule and test case:
   * Test the following:
   * ----
   * 1. on init, select all elements specified by `testCase.selector`
   *  - verify it has inline style matching `ruleValue` (2nd var in destructed 1st tuple param)
   *  - if `ruleValue` has `"!important"`, verify priority of inline style is `"important"`
   *
   * 2. set `value` of bound view model to empty string. For each of all elements queried by `testCase.selector`
   *  - verify each element has inline style value equal empty string,
   *    or default value (3rd var in destructed 1st tuple param)
   *
   * 3. set `value` of bound view model to `ruleValue` (2nd var in destructed 1st tuple param)
   *  - verify each element has inline style value equal `ruleValue`
   *  - if `ruleValue` has `"!important"`, verify priority of inline style is `"important"`
   *
   * 4. repeat step 2
   * 5. Call custom `assert` of each test case with necessary parameters
   */
  eachCartesianJoin(
    [rulesTests, testCases],
    ([ruleName, ruleValue, ruleDefaultValue, isInvalid, valueOnInvalid], testCase, callIndex) => {
      it(testCase.title(ruleName, ruleValue, callIndex), async () => {
        const { ctx, au, lifecycle, host, component, tearDown } = setup(
          testCase.template(ruleName),
          class App {
            public value: string = ruleValue;
          },
          BasicConfiguration,
          CustomElementResource.define(
            {
              name: 'child',
              template: `<template ${ruleName}.style="value"></template>`
            },
            class Child {
              public static bindables = {
                value: { property: 'value', attribute: 'value' }
              };
            }
          )
        );
        au.app({ host, component });
        au.start();
        try {
          const els: ArrayLike<HTMLElement> = typeof testCase.selector === 'string'
            ? host.querySelectorAll(testCase.selector)
            : testCase.selector(ctx.doc);
          const ii = els.length;
          const hasImportant = ruleValue.indexOf('!important') > -1;
          const ruleValueNoPriority = hasImportant ? ruleValue.replace('!important', '') : ruleValue;

          for (let i = 0; ii > i; ++i) {
            const el = els[i];
            assert.strictEqual(
              el.style.getPropertyValue(ruleName),
              isInvalid ? valueOnInvalid : ruleValueNoPriority,
              `[${ruleName}]vm.value="${ruleValue}" 1`
            );
            if (hasImportant) {
              assert.strictEqual(
                el.style.getPropertyPriority(ruleName),
                'important',
                `!important[${ruleName}]vm.value=${ruleValue} 1`
              );
            }
          }

          component.value = '';

          lifecycle.processRAFQueue(LifecycleFlags.none);

          for (let i = 0; ii > i; ++i) {
            const el = els[i];
            assert.strictEqual(el.style.getPropertyValue(ruleName), ruleDefaultValue, `[${ruleName}]vm.value="" 2`);
            if (hasImportant) {
              assert.strictEqual(
                el.style.getPropertyPriority(ruleName),
                '',
                `!important[${ruleName}]vm.value=${ruleValue} 2`
              );
            }
          }

          component.value = ruleValue;

          lifecycle.processRAFQueue(LifecycleFlags.none);

          for (let i = 0; ii > i; ++i) {
            const el = els[i];
            assert.strictEqual(
              el.style.getPropertyValue(ruleName),
              isInvalid ? valueOnInvalid : ruleValueNoPriority,
              `[${ruleName}]vm.value="${ruleValue}" 3`
            );
            if (hasImportant) {
              assert.strictEqual(
                el.style.getPropertyPriority(ruleName),
                'important',
                `!important[${ruleName}]vm.value=${ruleValue} 3`
              );
            }
          }

          component.value = '';

          lifecycle.processRAFQueue(LifecycleFlags.none);

          for (let i = 0; ii > i; ++i) {
            const el = els[i];
            assert.strictEqual(el.style.getPropertyValue(ruleName), ruleDefaultValue, `[${ruleName}]vm.value="" 4`);
            if (hasImportant) {
              assert.strictEqual(
                el.style.getPropertyPriority(ruleName),
                '',
                `!important[${ruleName}]vm.value=${ruleValue} 4`
              );
            }
          }

          // TODO: for inlined css, there are rules that employs fallback value when incoming value is inappropriate
          //        better test those scenarios

          await testCase.assert(au, lifecycle, host, component, [ruleName, ruleValue, ruleDefaultValue, isInvalid, valueOnInvalid], testCase);
        } finally {
          const em = ctx.container.get(IEventManager);
          em.dispose();
          tearDown();
        }
      });
    }
  );

  function noop() {/**/}

  interface IApp {
    value: any;
  }

  interface ITestCase {
    selector: string | ((document: Document) => ArrayLike<HTMLElement>);
    title(...args: unknown[]): string;
    template(...args: string[]): string;
    assert(au: Aurelia, lifecycle: ILifecycle, host: HTMLElement, component: IApp, ruleCase: [string, string, string, boolean?, string?], testCase): void | Promise<void>;
  }

  function setup<T>(template: string | Node, $class: Constructable<T> | null, ...registrations: any[]) {
    const ctx = TestContext.createHTMLTestContext();
    const { container, lifecycle, observerLocator } = ctx;
    container.register(...registrations);
    const host = ctx.doc.body.appendChild(ctx.createElement('app'));
    const au = new Aurelia(container);
    const App = CustomElementResource.define({ name: 'app', template }, $class);
    const component: T = new App();

    function tearDown() {
      ctx.doc.body.removeChild(host);
    }

    return { container, lifecycle, ctx, host, au, component, observerLocator, tearDown };
  }
});
