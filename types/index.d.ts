export type Clip = { kind: 'path' | 'next'; text: string }

declare module 'claude-code' {
  interface PluginState {
    'copy-list': { clips: Clip[] }
  }
}
