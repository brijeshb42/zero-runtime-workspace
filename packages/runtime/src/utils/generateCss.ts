import type { PluginCustomOptions } from './cssFnValueToVariable';
import { css, cache } from './emotion';

export type Theme = {
  [key: 'unstable_sxConfig' | string]: string | number | Theme;
};

type CssGenerationOptions = {
  injectInRoot?: boolean;
  defaultThemeKey?: string;
};

type RelevantTokenKey =
  | 'palette'
  | 'shadows'
  | 'shape'
  | 'typography'
  | 'zIndex'
  | 'direction'
  | 'transitions';
const topLevelTokenKeys: RelevantTokenKey[] = [
  'palette',
  'shadows',
  'shape',
  'typography',
  'zIndex',
  'direction',
  'transitions',
];

type CssVarsObject = Record<string, string | number | undefined>;

function iterateObject(
  tokenObject: object | string | number | boolean,
  cssVarsObject: CssVarsObject,
  prefix: string[]
) {
  if (Array.isArray(tokenObject)) {
    tokenObject.forEach((item, index) => {
      iterateObject(item, cssVarsObject, prefix.concat(`${index}`));
    });
  } else if (typeof tokenObject === 'object') {
    Object.entries(tokenObject).forEach(([key, value]) => {
      iterateObject(value, cssVarsObject, prefix.concat(key));
    });
  } else if (['string', 'number', 'boolean'].includes(typeof tokenObject)) {
    const cssVariableName = `--${prefix.filter(Boolean).join('-')}`;
    cssVarsObject[cssVariableName] =
      typeof tokenObject === 'string' ? tokenObject : tokenObject.toString();
  }
}

function generateCssForTheme(theme: Theme, prefix = ['']) {
  const cssVarsObject: CssVarsObject = {};
  topLevelTokenKeys.forEach((themeKey: RelevantTokenKey) => {
    const nestedPrefix = prefix.concat(themeKey);
    const tokenValue = theme[themeKey];
    iterateObject(tokenValue, cssVarsObject, nestedPrefix);
  });
  return cssVarsObject;
}

export function generateCss(
  options: PluginCustomOptions,
  generationOptions: CssGenerationOptions = {}
) {
  const { injectInRoot = true, defaultThemeKey = 'theme' } = generationOptions;
  const { cssVariablesPrefix = 'mui', themeArgs } = options;
  if (!themeArgs) {
    return '';
  }
  let cssStr = '';
  Object.entries(themeArgs).forEach(([themeKey, theme]) => {
    const cssVarsObject = generateCssForTheme(theme as Theme, [
      cssVariablesPrefix,
    ]);
    const cssThemeObject: Record<string, CssVarsObject> = {};
    if (themeKey === defaultThemeKey && injectInRoot) {
      cssThemeObject[':root'] = cssVarsObject;
    } else {
      cssThemeObject[`.${themeKey}`] = cssVarsObject;
    }
    const cssClass = css(cssThemeObject);
    cssStr += cache.registered[cssClass];
  });
  return cssStr;
}
