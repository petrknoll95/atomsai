import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'AtomsAI — Powerful AI. Built for real use.',description:'AI for the conversations, decisions and workflows that keep business moving. Use our applications, build with PyAI, or work with us on something custom.'};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang='en'><head><link rel='preload' href='/fonts/FoundersGrotesk-Regular.woff2' as='font' type='font/woff2' crossOrigin='anonymous'/><link rel='preload' href='/fonts/PPNeueMontreal-Variable.ttf' as='font' type='font/ttf' crossOrigin='anonymous'/></head><body><a className='skip-link' href='#hero-heading'>Skip to content</a>{children}</body></html>; }
