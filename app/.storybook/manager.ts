import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';

const theme = create({
  base: 'light',
  brandTitle: 'Pixdone Design System',
  brandUrl: '/',
  colorPrimary: '#7B61FF',
  colorSecondary: '#7B61FF',
  fontBase: '"Inter", "Noto Sans JP", system-ui, sans-serif',
  fontCode: '"JetBrains Mono", monospace',
  appBg: '#F7F7F8',
  appContentBg: '#FFFFFF',
  appBorderColor: '#DDDEE3',
  appBorderRadius: 8,
  textColor: '#191D24',
  textInverseColor: '#FFFFFF',
  barTextColor: '#4C5160',
  barSelectedColor: '#7B61FF',
  barHoverColor: '#5B43D6',
  inputTextColor: '#191D24',
  inputBorderColor: '#A6AAB6',
  buttonBg: '#FFFFFF',
  buttonBorder: '#DDDEE3',
  booleanBg: '#F7F7F8',
  booleanSelectedBg: '#7B61FF',
});

addons.setConfig({
  theme,
});
