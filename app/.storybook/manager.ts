import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';

const theme = create({
  base: 'dark',
  brandTitle: 'Pixdone Design System',
  brandUrl: '/',
  colorPrimary: '#7B61FF',
  colorSecondary: '#7B61FF',
  fontBase: '"Inter", "Noto Sans JP", system-ui, sans-serif',
  fontCode: '"JetBrains Mono", monospace',

  // App shell
  appBg: '#12151C',
  appContentBg: '#1A1F2C',
  appBorderColor: '#363E55',
  appBorderRadius: 8,

  // Text
  textColor: '#E8EBF4',
  textInverseColor: '#191D24',

  // Navigation bar
  barTextColor: '#9DA3B4',
  barSelectedColor: '#7B61FF',
  barHoverColor: '#A590FF',
  barBg: '#12151C',

  // Form inputs
  inputTextColor: '#E8EBF4',
  inputBorderColor: '#363E55',
  inputBg: '#1E2435',

  // Buttons
  buttonBg: '#1E2435',
  buttonBorder: '#363E55',

  // Toggle
  booleanBg: '#1E2435',
  booleanSelectedBg: '#7B61FF',
});

addons.setConfig({
  theme,
});
