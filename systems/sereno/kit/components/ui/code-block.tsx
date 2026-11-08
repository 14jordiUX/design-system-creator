"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { CheckIcon, CopyIcon } from "lucide-react"

import { Button } from "./button"

const codeBlockVariants = cva(
  "rounded-card text-ui data-[size=sm]:text-caption has-[>[data-slot=code-block-content]:focus-visible]:focus-ring group/code-block relative flex w-full min-w-0 flex-col overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-thin border-input text-foreground dark:bg-input has-[>[data-slot=code-block-content]:focus-visible]:border-ring",
        destructive: "border-thin border-destructive text-destructive dark:border-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function CodeBlock({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof codeBlockVariants> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="code-block"
      data-variant={variant}
      data-size={size}
      className={cn(codeBlockVariants({ variant }), className)}
      {...props}
    />
  )
}

function CodeBlockHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="code-block-header"
      className={cn(
        "gap-gap-sm px-inset-lg pt-inset-lg text-muted-foreground group-data-[variant=destructive]/code-block:text-destructive group-data-[size=sm]/code-block:px-inset-md group-data-[size=sm]/code-block:pt-inset-md flex min-w-0 shrink-0 items-center *:has-[>[data-slot=code-block-title]]:min-w-0",
        className
      )}
      {...props}
    />
  )
}

function CodeBlockTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="code-block-title"
      className={cn(
        "font-base text-ui font-emphasis text-foreground group-data-[variant=destructive]/code-block:text-destructive *:[svg]:me-gap-xs [&_svg:not([class*='size-'])]:size-icon-md group-data-[size=sm]/code-block:text-caption group-data-[size=sm]/code-block:[&_svg:not([class*='size-'])]:size-icon-sm min-w-0 truncate [&_svg]:pointer-events-none [&_svg]:inline-block [&_svg]:align-middle",
        className
      )}
      {...props}
    />
  )
}

function CodeBlockActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="code-block-actions"
      className={cn(
        "-my-gap-2xs -me-gap-xs gap-gap-2xs [[data-slot=code-block]>&]:m-0 [[data-slot=code-block]>&]:top-inset-md [[data-slot=code-block]>&]:end-inset-md group-data-[size=sm]/code-block:[[data-slot=code-block]>&]:top-inset-sm group-data-[size=sm]/code-block:[[data-slot=code-block]>&]:end-inset-sm [[data-slot=code-block]>&]:*:[button]:bg-background [[data-slot=code-block]>&]:*:[button]:border-thin [[data-slot=code-block]>&]:*:[button]:border-border ms-auto flex shrink-0 items-center [[data-slot=code-block]>&]:absolute [[data-slot=code-block]>&]:z-raised [[data-slot=code-block]>&]:opacity-0 [[data-slot=code-block]>&]:transition-opacity [[data-slot=code-block]>&]:group-focus-within/code-block:opacity-100 [[data-slot=code-block]>&]:group-hover/code-block:opacity-100 [[data-slot=code-block]>&]:pointer-coarse:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function CodeBlockCopyButton({
  value,
  variant = "ghost",
  size = "icon-xs",
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & { value: string }) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) {
      return
    }

    const timeout = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <>
      <Button
        data-slot="code-block-copy-button"
        data-copied={copied || undefined}
        variant={variant}
        size={size}
        aria-label={copied ? "Copied" : "Copy"}
        className={cn("", className)}
        onClick={(event) => {
          onClick?.(event)
          navigator.clipboard
            .writeText(value)
            .then(() => setCopied(true))
            .catch(() => {})
        }}
        {...props}
      >
        {copied ? (
          <CheckIcon />
        ) : (
          <CopyIcon />
        )}
      </Button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </>
  )
}

function CodeBlockContent({
  className,
  children,
  style,
  wrap = false,
  lineNumbers = false,
  startLine = 1,
  ...props
}: React.ComponentProps<"pre"> & {
  wrap?: boolean
  lineNumbers?: boolean
  startLine?: number
}) {
  return (
    <pre
      data-slot="code-block-content"
      data-wrap={wrap || undefined}
      data-numbered={lineNumbers || undefined}
      dir="ltr"
      tabIndex={0}
      style={{ counterReset: `line ${startLine - 1}`, ...style }}
      className={cn(
        "px-inset-lg py-inset-lg leading-prose group-has-data-[slot=code-block-header]/code-block:pt-inset-sm group-has-data-[slot=code-block-footer]/code-block:pb-inset-sm group-data-[size=sm]/code-block:px-inset-md group-data-[size=sm]/code-block:py-inset-md group-data-[size=sm]/code-block:group-has-data-[slot=code-block-header]/code-block:pt-inset-xs min-h-0 min-w-0 scroll-fade-x scrollbar-thin overflow-auto text-start font-code outline-none data-wrap:scroll-fade-y data-wrap:wrap-break-word data-wrap:whitespace-pre-wrap",
        className
      )}
      {...props}
    >
      <code
        data-slot="code-block-code"
        className="grid min-h-lh min-w-max content-start in-data-numbered:grid-cols-[auto_1fr] in-data-wrap:min-w-0"
      >
        {lineNumbers && typeof children === "string"
          ? children
              .replace(/\n$/, "")
              .split("\n")
              .map((line, index) => (
                <CodeBlockLine key={index}>{line}</CodeBlockLine>
              ))
          : children}
      </code>
    </pre>
  )
}

const codeBlockLineVariants = cva(
  "-mx-gap-lg px-inset-lg in-data-numbered:gap-x-gap-md before:min-w-avatar-sm before:text-end before:text-muted-foreground after:start-inset-2xs after:text-muted-foreground group-data-[size=sm]/code-block:-mx-gap-md group-data-[size=sm]/code-block:px-inset-md relative block min-h-lh after:absolute after:top-0 after:select-none in-data-numbered:col-span-2 in-data-numbered:grid in-data-numbered:grid-cols-subgrid in-data-numbered:[counter-increment:line] in-data-numbered:before:content-[counter(line)] in-data-numbered:before:select-none in-data-numbered:supports-[content:counter(line)_/_'']:before:content-[counter(line)_/_'']",
  {
    variants: {
      variant: {
        default: "",
        added: "bg-muted after:content-['+']",
        removed: "bg-danger-subtle after:text-destructive after:content-['−']",
        highlighted: "bg-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function CodeBlockLine({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof codeBlockLineVariants>) {
  // An empty line holds a newline so copying a selection keeps blank lines.
  const empty =
    children === undefined ||
    children === null ||
    children === "" ||
    (Array.isArray(children) && children.length === 0)

  return (
    <span
      data-slot="code-block-line"
      data-variant={variant}
      className={cn(codeBlockLineVariants({ variant }), className)}
      {...props}
    >
      <span data-slot="code-block-line-content" className="min-w-0">
        {empty ? "\n" : children}
      </span>
    </span>
  )
}

function CodeBlockFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="code-block-footer"
      className={cn(
        "gap-gap-sm px-inset-lg pb-inset-lg text-muted-foreground group-data-[size=sm]/code-block:px-inset-md group-data-[size=sm]/code-block:pb-inset-md flex min-w-0 shrink-0 items-center",
        className
      )}
      {...props}
    />
  )
}

export {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockContent,
  CodeBlockLine,
  CodeBlockFooter,
}
