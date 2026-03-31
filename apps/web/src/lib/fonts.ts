import { Instrument_Sans, Noto_Serif_SC } from 'next/font/google'

const sansFont = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--app-font-sans',
  display: 'swap',
})

export { sansFont, serifFont }

const serifFont = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--app-font-serif',
  display: 'swap',
  // adjustFontFallback: false,
  fallback: ['Noto Serif SC'],
})
