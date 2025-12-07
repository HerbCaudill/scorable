import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '../components/Input'

const meta = {
  title: 'Components/Input',
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

export const WithLabel: Story = {
  args: {
    label: 'Player name',
    placeholder: 'John Doe',
  },
}

export const WithError: Story = {
  args: {
    label: 'Player name',
    placeholder: 'John Doe',
    error: 'Player name is required',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Player name',
    placeholder: 'Disabled input',
    disabled: true,
  },
}
