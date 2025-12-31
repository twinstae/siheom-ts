import type { Meta, StoryObj } from '@storybook/react-vite';
 
import { Counter } from './Counter';
 
const meta = {
  component: Counter,
} satisfies Meta<typeof Counter>;
 
export default meta;
type Story = StoryObj<typeof meta>;
 
export const Primary: Story = {
  args: {
  },
};