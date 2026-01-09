import type { Meta, StoryObj } from "@storybook/react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a player" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="herb">Herb</SelectItem>
        <SelectItem value="lynne">Lynne</SelectItem>
        <SelectItem value="nolan">Nolan</SelectItem>
        <SelectItem value="mike">Mike</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const WithGroups: Story = {
  name: "With groups",
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a player" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Team A</SelectLabel>
          <SelectItem value="herb">Herb</SelectItem>
          <SelectItem value="lynne">Lynne</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Team B</SelectLabel>
          <SelectItem value="nolan">Nolan</SelectItem>
          <SelectItem value="mike">Mike</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a player" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="herb">Herb</SelectItem>
        <SelectItem value="lynne">Lynne</SelectItem>
      </SelectContent>
    </Select>
  ),
}
