import type { ExpressionValue } from '@linaria/utils';
import { transformSync, type Node } from '@babel/core';
import { parseExpression } from '@babel/parser';
import type { Expression } from '@linaria/tags';
import * as t from '@babel/types';
import { isUnitLess } from './isUnitLess';
import { cssFunctionTransformerPlugin } from './cssFunctionTransformerPlugin';

interface StyleObj {
  [key: string]: string | number | (() => void) | StyleObj;
}

export type PluginCustomOptions = {
  /**
   * To generate css variables like this `--{cssVariablesPrefix}-palette-primary-main`
   */
  cssVariablesPrefix?: string;
  /**
   * Object to pass as parameter to the styled css callback functions.
   */
  themeArgs?: Record<string, unknown>;
};

type CssFnValueToVariableParams = {
  styleObj: unknown;
  expressionValue: ExpressionValue | null;
  getVariableName: (cssKey: string, source: string, hasUnit: boolean) => string;
  filename?: string | null;
  options: PluginCustomOptions;
};

function transformThemeKeysInFn(
  styleKey: string,
  functionString: string,
  options: PluginCustomOptions,
  filename?: string,
) {
  const { themeArgs: { theme } = {} } = options;

  // return the function as-is if sxConfig does not contain
  // this css key
  if (!theme) {
    return parseExpression(functionString);
  }

  const result = transformSync(functionString, {
    plugins: [
      [
        cssFunctionTransformerPlugin,
        {
          styleKey,
          options,
        },
      ],
    ],
    filename: filename ?? 'intermediate-fn.ts',
    ast: true,
    configFile: false,
    babelrc: false,
  });
  const firstItem = result?.ast?.program.body[0];
  if (!firstItem) {
    return parseExpression(functionString);
  }
  if (firstItem.type === 'ExpressionStatement') {
    return firstItem.expression;
  }
  if (firstItem.type === 'FunctionDeclaration') {
    return t.functionExpression(null, firstItem.params, firstItem.body);
  }
  return parseExpression(functionString);
}

function iterateAndReplaceFunctions(
  styleObj: unknown,
  expressionValue: ExpressionValue | null,
  getVariableName: (cssKey: string, source: string, hasUnit: boolean) => string,
  options: PluginCustomOptions,
  acc: [string, Node, boolean][],
  filename?: string,
) {
  const css = styleObj as StyleObj;
  Object.keys(css).forEach((key) => {
    const value = css[key];

    if (typeof value === 'object') {
      if (!Array.isArray(value)) {
        iterateAndReplaceFunctions(
          value,
          expressionValue,
          getVariableName,
          options,
          acc,
          filename,
        );
      }
      return;
    }

    if (typeof value !== 'function') {
      return;
    }

    try {
      const fnString = value.toString();
      const expression = transformThemeKeysInFn(
        key,
        fnString,
        options,
        filename,
      );
      const unitLess = isUnitLess(key);
      const variableId = getVariableName(key, fnString, unitLess);
      acc.push([variableId, expression, unitLess]);
      css[key] = `var(--${variableId})`;
    } catch (ex) {
      const err = expressionValue?.buildCodeFrameError(
        (ex as Error).message || 'Could not parse function expression.',
      ) as Error;
      if (!err) {
        throw ex;
      }
      if ('cause' in err) {
        err.cause = ex;
      }
      throw err;
    }
  });
}

/**
 * Goes through the css object and identifies any keys where the value is a function and replaces the function with a variable id.
 */
export function cssFnValueToVariable({
  styleObj,
  expressionValue,
  getVariableName,
  filename,
  options,
}: CssFnValueToVariableParams) {
  const acc: [string, Expression, boolean][] = [];
  iterateAndReplaceFunctions(
    styleObj,
    expressionValue,
    getVariableName,
    options,
    acc,
    filename ?? undefined,
  );
  return acc;
}
