import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../components/Button'

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'New game',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    children: 'Cancel',
  },
}

export const Small: Story = {
  args: {
    variant: 'primary',
    size: 'sm',
    children: 'Small button',
  },
}

export const Large: Story = {
  args: {
    variant: 'primary',
    size: 'lg',
    children: 'Start game',
  },
}

export const Disabled: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Disabled',
    disabled: true,
  },
}
