import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../components/Button'

const HomeScreen = () => {
  return (
    <div className="min-h-screen bg-white p-6 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center space-y-12">
        <h1 className="text-4xl font-bold text-black text-center">Scrabble</h1>

        <Button variant="primary" size="lg">
          New game
        </Button>
      </div>

      <div className="border-t border-gray-300 pt-8">
        <h2 className="text-xl font-bold text-black mb-6">Past games</h2>
        <div className="space-y-4">
          <div className="border border-gray-300 p-4 rounded">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-black">Oct 23</span>
              <div className="text-right">
                <p className="font-medium text-black">
                  Herb <span className="text-gray-600">199</span>
                </p>
                <p className="text-gray-600">Lynne 243</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-300 p-4 rounded">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-black">Oct 29</span>
              <div className="text-right">
                <p className="font-medium text-black">
                  Herb <span className="text-gray-600">188</span>
                </p>
                <p className="text-gray-600">Lynne 152</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const meta = {
  title: 'Screens/Home',
  component: HomeScreen,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof HomeScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
