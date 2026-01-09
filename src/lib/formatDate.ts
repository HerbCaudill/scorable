type FormatDateOptions = {
  includeYear?: boolean
}

export const formatDate = (timestamp: number, options: FormatDateOptions = {}) => {
  const { includeYear = false } = options
  const date = new Date(timestamp)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear && { year: "numeric" }),
  })
}
