export const TYPE_COLOR_OPTIONS = [
  { value: 'green', label: 'Green', chip: 'bg-green-500', badge: 'bg-green-100 text-green-800' },
  { value: 'yellow', label: 'Yellow', chip: 'bg-amber-400', badge: 'bg-amber-100 text-amber-800' },
  { value: 'red', label: 'Red', chip: 'bg-red-500', badge: 'bg-red-100 text-red-800' },
  { value: 'grey', label: 'Grey', chip: 'bg-gray-400', badge: 'bg-gray-100 text-gray-700' },
]

export function getTypeBadgeClass(color) {
  return (
    TYPE_COLOR_OPTIONS.find((option) => option.value === color)?.badge ||
    TYPE_COLOR_OPTIONS[0].badge
  )
}
