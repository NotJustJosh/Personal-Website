// troika-three-text (the text renderer behind drei's <Text>) ships no types.
// Only the one call src/lib/selfHosted.ts makes is declared here.
declare module 'troika-three-text' {
  export function configureTextBuilder(config: {
    /** Base URL of the unicode-font-resolver data (codepoint index + font files). */
    unicodeFontsURL?: string
    defaultFontURL?: string
  }): void
}
