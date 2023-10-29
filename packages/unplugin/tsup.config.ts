import { Options, defineConfig } from 'tsup';
import config from '../../tsup.config';

const baseConfig = {
  ...(config as Options),
  tsconfig: './tsconfig.build.json',
};

export default defineConfig(baseConfig);
