import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '@/components/ui/input'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithValue: Story = {
  name: 'With value',
  args: {
    placeholder: 'Player name',
    defaultValue: 'John Doe',
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
}

export const WithType: Story = {
  name: 'With type',
  args: {
    type: 'email',
    placeholder: 'Enter email...',
  },
}
