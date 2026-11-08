"use client"

import * as React from "react"
import { Questionnaire as QuestionnairePrimitive } from "@shadcn/react/questionnaire"
import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

import { buttonVariants, type Button } from "@/components/ui/button"

function Questionnaire({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Root>) {
  return (
    <QuestionnairePrimitive.Root
      data-slot="questionnaire"
      className={cn("gap-gap-xl flex w-full min-w-0 flex-col", className)}
      {...props}
    />
  )
}

function QuestionnaireProgress({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Progress>) {
  return (
    <QuestionnairePrimitive.Progress
      data-slot="questionnaire-progress"
      className={cn(
        "text-caption min-h-[1lh] w-fit min-w-[14ch] font-emphasis text-muted-foreground tabular-nums",
        className
      )}
      {...props}
    />
  )
}

function QuestionnaireItem({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Item>) {
  return (
    <QuestionnairePrimitive.Item
      data-slot="questionnaire-item"
      className={cn(
        "flex flex-col gap-gap-lg min-w-0 border-0 p-0 outline-none",
        className
      )}
      {...props}
    />
  )
}

function QuestionnaireTitle({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Title>) {
  return (
    <QuestionnairePrimitive.Title
      data-slot="questionnaire-title"
      className={cn(
        "text-body font-strong [&:not(:has(~[data-slot=questionnaire-description]))]:mb-gap-lg text-pretty",
        className
      )}
      {...props}
    />
  )
}

function QuestionnaireDescription({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Description>) {
  return (
    <QuestionnairePrimitive.Description
      data-slot="questionnaire-description"
      className={cn(
        "text-ui text-pretty text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function QuestionnaireChoices({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choices>) {
  return (
    <QuestionnairePrimitive.Choices
      data-slot="questionnaire-choices"
      className={cn(
        "gap-gap-md group/questionnaire-choices grid min-w-0",
        className
      )}
      {...props}
    />
  )
}

function QuestionnaireChoice({
  children,
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Choice>) {
  return (
    <QuestionnairePrimitive.Choice
      data-slot="questionnaire-choice"
      className={cn(
        "border-input dark:bg-input hover:bg-subtle data-checked:border-primary data-checked:bg-muted dark:data-checked:bg-muted data-invalid:border-destructive has-[>input:focus-visible]:border-ring gap-gap-md rounded-control border-thin bg-transparent px-inset-lg py-inset-md text-ui shadow-flat has-[>input:focus-visible]:focus-ring group/questionnaire-choice relative flex min-h-control-lg cursor-pointer items-start text-start transition-colors outline-none select-none",
        "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-disabled",
        className
      )}
      {...props}
    >
      <QuestionnairePrimitive.ChoiceInput
        data-slot="questionnaire-choice-input"
        className="absolute inset-0 z-raised size-full cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        data-slot="questionnaire-choice-indicator"
        className="border-input dark:bg-input group-data-checked/questionnaire-choice:bg-primary dark:group-data-checked/questionnaire-choice:bg-primary group-data-checked/questionnaire-choice:text-primary-foreground group-data-checked/questionnaire-choice:border-primary size-icon-md translate-y-inset-3xs group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-inset-3xs rounded-inner pointer-events-none relative flex shrink-0 items-center justify-center border-thin group-data-[type=radio]/questionnaire-choice:rounded-pill"
      >
        <span
          data-slot="questionnaire-choice-indicator-dot"
          className="bg-primary-foreground size-indicator hidden rounded-pill group-data-[type=checkbox]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
        />
        <CheckIcon
          data-slot="questionnaire-choice-indicator-check"
          className="size-icon-sm hidden group-data-[type=radio]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block" />
      </span>
      <QuestionnairePrimitive.ChoiceLabel
        data-slot="questionnaire-choice-label"
        className="gap-gap-2xs flex min-w-0 flex-1 flex-col leading-compact"
      >
        {children}
      </QuestionnairePrimitive.ChoiceLabel>
      <QuestionnairePrimitive.ChoiceShortcut
        data-slot="questionnaire-choice-shortcut"
        className="border-input bg-background text-muted-foreground size-icon-lg translate-y-inset-3xs group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-inset-3xs items-center justify-center rounded-control border-thin font-code text-caption font-emphasis leading-compact shadow-flat pointer-events-none ms-auto hidden shrink-0 group-data-[shortcut]/questionnaire-choice:inline-flex"
      />
    </QuestionnairePrimitive.Choice>
  )
}

function QuestionnaireChoiceDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="questionnaire-choice-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

function QuestionnaireInput({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Input>) {
  return (
    <div
      data-slot="questionnaire-input-wrapper"
      className="w-full group/questionnaire-input relative min-w-0"
    >
      <QuestionnairePrimitive.Input
        data-slot="questionnaire-input"
        className={cn(
          "dark:bg-input border-input focus-visible:border-ring aria-invalid:border-destructive dark:aria-invalid:border-destructive h-control-md rounded-control border-thin bg-transparent px-inset-sm py-inset-2xs text-body shadow-flat focus-visible:focus-ring aria-invalid:focus-ring md:text-ui min-h-control-lg w-full min-w-0 transition-[color,box-shadow,background-color] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-disabled sm:min-h-0",
          "selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground",
          className
        )}
        {...props}
      />
    </div>
  )
}

function QuestionnaireError({
  className,
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Error>) {
  return (
    <QuestionnairePrimitive.Error
      data-slot="questionnaire-error"
      className={cn("text-ui text-destructive", className)}
      {...props}
    />
  )
}

function QuestionnaireActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="questionnaire-actions"
      className={cn(
        "gap-gap-sm sm:min-h-control-md grid min-h-control-lg w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center",
        className
      )}
      {...props}
    />
  )
}

function QuestionnairePrevious({
  children,
  className,
  size = "default",
  variant = "outline",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Previous> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Previous
      data-slot="questionnaire-previous"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-1 row-start-1 min-h-control-lg justify-self-start sm:min-h-0",
        className
      )}
      {...props}
    >
      {children ?? "Previous"}
    </QuestionnairePrimitive.Previous>
  )
}

function QuestionnaireSkip({
  children,
  className,
  size = "default",
  variant = "outline",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Skip> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Skip
      data-slot="questionnaire-skip"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-2 row-start-1 min-h-control-lg justify-self-end sm:min-h-0",
        className
      )}
      {...props}
    >
      {children ?? "Skip"}
    </QuestionnairePrimitive.Skip>
  )
}

function QuestionnaireNext({
  children,
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Next> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Next
      data-slot="questionnaire-next"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-control-lg justify-self-end sm:min-h-0",
        className
      )}
      {...props}
    >
      {children ?? "Next"}
    </QuestionnairePrimitive.Next>
  )
}

function QuestionnaireSubmit({
  children,
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<typeof QuestionnairePrimitive.Submit> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  return (
    <QuestionnairePrimitive.Submit
      data-slot="questionnaire-submit"
      data-size={size}
      data-variant={variant}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-control-lg justify-self-end sm:min-h-0",
        className
      )}
      {...props}
    >
      {children ?? "Submit"}
    </QuestionnairePrimitive.Submit>
  )
}

export {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
}
