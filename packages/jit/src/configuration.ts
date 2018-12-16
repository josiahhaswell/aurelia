import { DI, IContainer, IRegistry, Registration } from '@aurelia/kernel';
import { ITemplateCompiler } from '@aurelia/runtime';
import { BasicConfiguration as HtmlRuntimeConfiguration } from '@aurelia/runtime-html';
import {
  DotSeparatedAttributePattern,
  RefAttributePattern
} from './attribute-pattern';
import {
  CallBindingCommand,
  CaptureBindingCommand,
  DefaultBindingCommand,
  DelegateBindingCommand,
  ForBindingCommand,
  FromViewBindingCommand,
  OneTimeBindingCommand,
  ToViewBindingCommand,
  TriggerBindingCommand,
  TwoWayBindingCommand
} from './binding-command';
import { ParserRegistration } from './expression-parser';
import { TemplateCompiler } from './template-compiler';

export const DefaultBindingLanguage: IRegistry[] = [
  DefaultBindingCommand,
  OneTimeBindingCommand,
  ToViewBindingCommand,
  FromViewBindingCommand,
  TwoWayBindingCommand,
  TriggerBindingCommand,
  DelegateBindingCommand,
  CaptureBindingCommand,
  CallBindingCommand,
  ForBindingCommand,
  DotSeparatedAttributePattern,
  RefAttributePattern
];

export const BasicConfiguration = {
  register(container: IContainer): void {
    container.register(
      HtmlRuntimeConfiguration,
      ParserRegistration,
      Registration.singleton(ITemplateCompiler, TemplateCompiler),
      ...DefaultBindingLanguage
    );
  },
  createContainer(): IContainer {
    const container = DI.createContainer();
    container.register(BasicConfiguration);
    return container;
  }
};
