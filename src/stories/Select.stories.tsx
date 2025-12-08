import type { Meta, StoryObj } from '@storybook/react'
import { Select } from '@/components/Select'

const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const sampleOptions = [
  { value: 'herb', label: 'Herb' },
  { value: 'lynne', label: 'Lynne' },
  { value: 'nolan', label: 'Nolan' },
  { value: 'mike', label: 'Mike' },
]

export const Default: Story = {
  args: {
    options: sampleOptions,
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Select a player',
    options: sampleOptions,
  },
}

export const WithError: Story = {
  args: {
    label: 'Select a player',
    options: sampleOptions,
    error: 'Please select a player',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Select a player',
    options: sampleOptions,
    disabled: true,
  },
}
