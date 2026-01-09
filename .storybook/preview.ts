import type { Preview } from "@storybook/react-vite"
import { INITIAL_VIEWPORTS } from "storybook/viewport"
import "../src/index.css"

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: ["UI", "Components", "*"],
      },
    },
    viewport: {
      options: INITIAL_VIEWPORTS,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  initialGlobals: {
    viewport: { value: "iphone14promax", isRotated: false },
  },
}

export default preview
