import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "@/components/ui/button"

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "default",
    size: "default",
    children: "New game",
  },
}

export const Secondary: Story = {
  args: {
    variant: "secondary",
    size: "default",
    children: "Cancel",
  },
}

export const Outline: Story = {
  args: {
    variant: "outline",
    size: "default",
    children: "Outline",
  },
}

export const Destructive: Story = {
  args: {
    variant: "destructive",
    size: "default",
    children: "Delete",
  },
}

export const Ghost: Story = {
  args: {
    variant: "ghost",
    size: "default",
    children: "Ghost",
  },
}

export const Link: Story = {
  args: {
    variant: "link",
    size: "default",
    children: "Link button",
  },
}

export const Small: Story = {
  args: {
    variant: "default",
    size: "sm",
    children: "Small button",
  },
}

export const Large: Story = {
  args: {
    variant: "default",
    size: "lg",
    children: "Start game",
  },
}

export const Disabled: Story = {
  args: {
    variant: "default",
    size: "default",
    children: "Disabled",
    disabled: true,
  },
}
