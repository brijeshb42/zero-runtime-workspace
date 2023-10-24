import type * as React from 'react';
import type { CSSObject } from './base';
import type { ThemeArgs } from './theme';
import type { SxProp } from './sx';

type Falsy = false | 0 | '' | null | undefined;

export interface StyledOptions<Props = any> {
  name?: string;
  slot?: string;
  skipSx?: boolean;
  skipVariantsResolver?: boolean;
  overridesResolver?: (
    props: Props,
    styles: Record<string, string>,
  ) => (string | Falsy) | Array<string | Falsy>;
}

export interface StyledVariants<Props extends object> {
  props: Partial<Props>;
  style: CSSObject<Props>;
}

export type StyledCssArgument<Props extends object> = CSSObject<Props> & {
  variants?: Array<StyledVariants<Props>>;
};

export type StyledCallback<Props extends object> = (
  buildArg: ThemeArgs,
) => StyledCssArgument<Props>;

export type StyledArgument<Props extends object> = StyledCssArgument<Props> | StyledCallback<Props>;

export type NoInfer<T> = [T][T extends any ? 0 : never];
type FastOmit<T extends object, U extends string | number | symbol> = {
  [K in keyof T as K extends U ? never : K]: T[K];
};
export type Substitute<A extends object, B extends object> = FastOmit<A, keyof B> & B;

export type PolymorphicComponentProps<
  BaseProps extends object,
  AsTarget extends React.ElementType | void,
  AsTargetProps extends object = AsTarget extends React.ElementType
    ? React.ComponentPropsWithRef<AsTarget>
    : {},
> = NoInfer<Omit<Substitute<BaseProps, AsTargetProps>, 'as'>> & {
  as?: AsTarget;
  sx?: SxProp;
};

export interface PolymorphicComponent<BaseProps extends object>
  extends React.ForwardRefExoticComponent<BaseProps> {
  <AsTarget extends React.ElementType | void = void>(
    props: PolymorphicComponentProps<BaseProps, AsTarget>,
  ): JSX.Element;
}

export interface StyledComponent<Props extends object = {}> extends PolymorphicComponent<Props> {
  defaultProps?: Partial<Props> | undefined;
  toString: () => string;
}

export type CreateStyledComponent<
  Component extends React.ElementType,
  OuterProps extends object,
> = {
  /**
   * @typeparam Props: Additional props to add to the styled component
   */
  <Props extends object = {}>(
    ...styles: Array<StyledArgument<Substitute<OuterProps, Props>>>
  ): StyledComponent<Substitute<OuterProps, Props>> & (Component extends string ? {} : Component);
};

export interface StyledOptions<Props extends object = any> {
  name?: string;
  slot?: string;
  skipSx?: boolean;
  skipVariantsResolver?: boolean;
  overridesResolver?: (
    props: Props,
    styles: Record<string, string>,
  ) => (string | Falsy) | Array<string | Falsy>;
}

export type CreateStyled = {
  <
    OuterProps extends object,
    TagOrComponent extends React.ElementType,
    FinalProps extends object = OuterProps & React.ComponentPropsWithRef<TagOrComponent>,
  >(
    tag: TagOrComponent,
    options?: StyledOptions,
  ): CreateStyledComponent<TagOrComponent, FinalProps>;
};

export type CreateStyledIndex = {
  [Key in keyof JSX.IntrinsicElements]: CreateStyledComponent<Key, JSX.IntrinsicElements[Key]>;
};

declare const styled: CreateStyled & CreateStyledIndex;
export default styled;
