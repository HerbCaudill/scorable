import type { Meta, StoryObj } from '@storybook/react'
import ScrabbleBoard from '../components/ScrabbleBoard'

const meta = {
  title: 'Components/ScrabbleBoard',
  component: ScrabbleBoard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScrabbleBoard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
