import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { withA11y } from '@storybook/addon-a11y';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true,
      sort: 'alpha',
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#f9fafb',
        },
        {
          name: 'dark',
          value: '#111827',
        },
        {
          name: 'white',
          value: '#ffffff',
        },
        {
          name: 'black',
          value: '#000000',
        },
      ],
    },
    viewport: {
      viewports: {
        ...INITIAL_VIEWPORTS,
        desktopLarge: {
          name: 'Desktop Large',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
      defaultViewport: 'responsive',
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
      options: {},
      manual: false,
    },
    docs: {
      source: {
        state: 'open',
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [withA11y],
};

export default preview;
