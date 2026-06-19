import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-soft hover:brightness-110',
        accent: 'bg-accent text-accent-foreground shadow-soft hover:brightness-105',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        outline: 'border border-input bg-card hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
