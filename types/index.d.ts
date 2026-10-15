export type Clip = { kind: 'path' | 'url' | 'next'; text: string }

declare module 'claude-code' {
  interface PluginState {
    'copy-list': { clips: Clip[]; offset: number; notice: string }
  }
}
