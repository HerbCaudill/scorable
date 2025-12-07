import React from 'react'
import ScrabbleBoard from '../components/ScrabbleBoard'

export default {
  title: 'Components/ScrabbleBoard',
  component: ScrabbleBoard,
}

const Template = args => <ScrabbleBoard {...args} />

export const Default = Template.bind({})
Default.args = {}
