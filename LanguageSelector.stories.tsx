import type { Meta, StoryObj } from '@storybook/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n/i18n'; // Correct path to i18n configuration
import LanguageSelector from './LanguageSelector';

const meta: Meta<typeof LanguageSelector> = {
  title: 'Components/Common/LanguageSelector',
  component: LanguageSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A language selector component that allows users to change their preferred language. Supports multiple languages and remembers user preferences.',
      },
    },
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LanguageSelector>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'The default language selector with English and Spanish options.',
      },
    },
  },
};

export const EnglishSelected: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    // Set English as the selected language
    i18n.changeLanguage('en');
  },
  parameters: {
    docs: {
      description: {
        story: 'Language selector with English selected as the active language.',
      },
    },
  },
};

export const SpanishSelected: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    // Set Spanish as the selected language
    i18n.changeLanguage('es');
  },
  parameters: {
    docs: {
      description: {
        story: 'Language selector with Spanish selected as the active language.',
      },
    },
  },
};
