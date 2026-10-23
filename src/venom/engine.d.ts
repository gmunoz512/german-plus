export function mountVenom(
  root: HTMLElement,
  opts: {
    canvas: HTMLCanvasElement
    button: HTMLButtonElement
    label: string
    fontFamily?: string
    fontWeight?: number
    letterSpacingEm?: number
    labelSize?: number
    halfHeight?: number
    padX?: number
    liftH?: number
    scale?: number
    offsetX?: number
    offsetY?: number
    gooColor?: string
    labelColor?: string
    floorColor?: string
  },
): { start(): void; stop(): void; destroy(): void } | null
