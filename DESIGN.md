---
name: Icon collection
description: A precise material library for architecture work.
colors:
  primary: "#146b62"
  rail: "#123e43"
  ground: "#f4f7f7"
  surface: "#ffffff"
  ink: "#173b40"
  muted: "#526c70"
  line: "#d5e0e1"
  selection: "#e1f4ec"
  focus: "#147fbd"
  dark-ground: "#142a30"
  dark-surface: "#1d353b"
  dark-ink: "#e3eeee"
  dark-muted: "#adc3c5"
  dark-line: "#3a5258"
  dark-primary: "#a9dfca"
typography:
  display:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "clamp(28px,3vw,42px)"
    fontWeight: 750
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 750
  body:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  label:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.5
rounded:
  control: "8px"
  button: "9px"
  specimen: "12px"
  panel: "14px"
  dialog: "16px"
spacing:
  tight: "8px"
  cell: "10px"
  control: "12px"
  group: "24px"
  section: "30px"
  desktop: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "12px 18px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "12px 18px"
---

# Design System: Icon collection

## Overview

**Creative North Star: "The material library"**

An operational specimen library: quiet porcelain fields let real Microsoft artwork carry the color, with a deep blue-green navigation rail to establish orientation. Standard web controls remain familiar. The selected collection is the one expressive movement, arriving as a compact tray without moving or altering the specimens.

This descriptive direction was inferred within the delegated build brief, not chosen in an interactive interview.

**Key Characteristics:**
- Clear work areas and compact humanist typography.
- Untouched specimens with full-name labels.
- Mint selection, no ornamental illustration.

## Colors

### Primary
The teal action color belongs to actionable controls and selection. Its light mint counterpart maintains contrast in dark mode.

### Neutral
Porcelain ground and white specimens keep the source artwork legible. Ink and muted blue-green text distinguish titles from metadata. Dark mode replaces the shell while retaining light icon presentation fields.

**The Source Fidelity Rule.** UI theming never recolors, crops or transforms icon artwork.

## Typography

Self-hosted Manrope Variable throughout, with system fallback. Display type is compact and balanced. Product labels are small but complete, not truncated. Counts use tabular numerals. Mobile headlines use 30px, detail titles 24px desktop / 22px mobile.

## Layout

A fluid, 1600px maximum container uses 48px desktop gutters, 30px below 1100px and 20px below 700px. The category rail is 224px, shrinking to 194px before becoming a horizontal scrolling chip list at mobile widths. Specimens use an auto-fill grid with a 145px minimum, narrowing to two equal columns on mobile. Space separates tasks rather than framing every text group.

## Elevation & Depth

Flat specimen cells use a single border. Only the collection tray and focus-protecting dialog float: tray shadow `0 8px 32px #071e3833`, dialog shadow `0 20px 80px #061f3955`. No decorative glow. The dialog backdrop is a flat translucent ink field.

## Shapes

Controls have compact rounded corners; specimens are 12px, panels 14px, dialog 16px. Artwork is never clipped by a mask. Images use contain sizing.

## Components

Buttons: teal primary exports, outlined secondary formats, underlined text actions. All have visible 3px focus rings with 4px offset. Search uses a 64px field, 56px mobile, with labeled input and a keyboard shortcut cue.

Category chips: muted rail default, mint selected, search-aware counts. Mobile chips retain horizontal overflow rather than compressing names.

Specimen cells: image, full name, primary category and optional verified November badge. The independent check control updates a mint selected state and collection tray. It is always visible on touch devices.

Detail dialog: native focus containment, close button and Escape dismissal; source artwork on a light field; primary SVG export and equal secondary PNG formats. Copy fallbacks are selectable text.

The tray enters once over 200ms with `cubic-bezier(.16,1,.3,1)`; reduced motion removes it. No artwork animation.

## Do's and Don'ts

### Do:
- Do keep service names readable and complete.
- Do preserve source artwork and aspect ratios.
- Do keep keyboard focus distinct in both themes.

### Don't:
- Don't use Microsoft artwork as the application's brand.
- Don't add decorative charts, gradients or fabricated usage claims.
- Don't hide core actions behind hover on touch devices.
