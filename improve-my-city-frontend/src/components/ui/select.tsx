"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { RiCheckLine, RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri"

import { cn } from "@/utils/helpers"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "group relative w-full cursor-pointer flex items-center justify-between gap-3 rounded-lg text-sm font-medium outline-none transition-colors duration-200",
        "data-[size=default]:h-10 data-[size=default]:px-4 data-[size=sm]:h-9 data-[size=sm]:px-3",
        "bg-input/20 text-foreground border border-input",
        "hover:bg-accent hover:border-ring",
        "data-[state=open]:bg-accent data-[state=open]:border-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
  "data-placeholder:text-muted-foreground",
        "aria-invalid:border-destructive aria-invalid:focus:border-destructive",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "[&_svg:not([class*='text-'])]:text-muted-foreground group-hover:[&_svg:not([class*='text-'])]:text-foreground",
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <RiArrowDownSLine className="size-4 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180 group-hover:opacity-80" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "relative z-103 overflow-hidden rounded-lg border-2",
          "bg-popover text-popover-foreground border border-border",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          position === "popper" && "w-(--radix-select-trigger-width)",
          "`max-h-(--radix-select-content-available-height)",
          className
        )}
        position={position}
        sideOffset={5}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
            "w-full scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "group relative flex flex-wrap w-full cursor-pointer items-center gap-3 rounded-lg py-2 pl-3 pr-10 text-sm font-medium outline-none select-none transition-colors duration-150",
  "data-disabled:pointer-events-none data-disabled:opacity-40",
        "text-muted-foreground",
  "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-[state=checked]:text-accent-foreground",
        "data-[state=checked]:font-semibold",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  "[&_svg:not([class*='text-'])]:text-muted-foreground group-data-highlighted:[&_svg:not([class*='text-'])]:text-accent-foreground",
        "*:data-[slot=item-text]:flex *:data-[slot=item-text]:items-center *:data-[slot=item-text]:gap-2",
        className
      )}
      {...props}
    >
      <span className="absolute right-3 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <RiCheckLine className="size-4 text-foreground font-bold" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <RiArrowUpSLine className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <RiArrowDownSLine className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}