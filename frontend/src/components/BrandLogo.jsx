export default function BrandLogo({ size = 'md' }) {
  const sizes = {
    sm: 'h-9 w-auto max-w-[7.5rem]',
    md: 'h-11 w-auto max-w-[9rem]',
    lg: 'h-14 w-auto max-w-[11rem]',
  }

  return (
    <img
      src="/luxe-logo.png"
      alt="Luxe Home Health"
      className={`${sizes[size]} object-contain shrink-0 rounded-md`}
    />
  )
}
