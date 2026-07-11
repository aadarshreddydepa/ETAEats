'use client'
import { useRef } from 'react'

interface OTPInputProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
}

export function OTPInput({ value, onChange, disabled }: OTPInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  function handleChange(idx: number, char: string) {
    if (!/^\d?$/.test(char)) return
    const arr = value.padEnd(6, ' ').split('')
    arr[idx] = char || ' '
    const next = arr.join('').trimEnd()
    onChange(next)
    if (char && idx < 5) inputs.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  return (
    <div className="flex gap-2 justify-between">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-13 w-11 sm:w-12 rounded-sm bg-surface border-[1.5px] border-border text-center text-[22px] font-semibold text-text-primary
                     transition-all duration-base ease-standard
                     focus:border-border-strong focus:bg-surface focus:outline-none
                     disabled:opacity-50"
        />
      ))}
    </div>
  )
}
