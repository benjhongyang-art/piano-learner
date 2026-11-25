import { Button } from '@/components/ui/button'

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string; short?: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-foreground/5 p-0.5">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? 'default' : 'ghost'}
          aria-pressed={value === option.value}
          className="h-10 px-2.5 sm:px-3"
          onClick={() => onChange(option.value)}
        >
          {option.short ? (
            <>
              <span className="sm:hidden">{option.short}</span>
              <span className="hidden sm:inline">{option.label}</span>
            </>
          ) : (
            option.label
          )}
        </Button>
      ))}
    </div>
  )
}
