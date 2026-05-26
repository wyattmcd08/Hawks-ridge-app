import type { InputHTMLAttributes, ReactNode } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  prefix?: string
  suffix?: string
}

export function Field({ label, prefix, suffix, className = '', ...rest }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-mute">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 focus-within:border-blood/60 transition-colors">
        {prefix && <span className="text-mute">{prefix}</span>}
        <input
          className={`w-full bg-transparent text-base text-ink outline-none placeholder:text-faint ${className}`}
          {...rest}
        />
        {suffix && <span className="text-mute">{suffix}</span>}
      </div>
    </label>
  )
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-mute">
        {label}
      </span>
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-base text-ink outline-none transition-colors placeholder:text-faint focus:border-blood/60"
      />
    </label>
  )
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-gradient-to-br from-ember to-blood-deep py-4 text-base font-semibold text-white shadow-glow transition active:scale-[0.98] disabled:opacity-40"
    >
      {children}
    </button>
  )
}
