import { assetPath, withBasePath } from '@/lib/base-path';
import type { Metadata } from 'next';
import './globals.css';
import { Feedback } from '@/components/feedback/feedback';
export const metadata:Metadata={title:'AtomsAI — Powerful AI. Built for real use.',description:'AI for the conversations, decisions and workflows that keep business moving. Use our applications, build with PyAI, or work with us on something custom.'};
const fontFaces = `
@font-face { font-family:'PP Neue Montreal'; src:url('${assetPath('/fonts/PPNeueMontreal-Variable.ttf')}') format('truetype'); font-style:normal; font-weight:200 800; font-display:swap; ascent-override:99.8%; descent-override:20.2%; }
@font-face { font-family:'Founders Grotesk'; src:url('${assetPath('/fonts/FoundersGrotesk-Regular.woff2')}') format('woff2'); font-style:normal; font-weight:400; font-display:swap; }
@font-face { font-family:'Founders Grotesk'; src:url('${assetPath('/fonts/FoundersGrotesk-Medium.woff2')}') format('woff2'); font-style:normal; font-weight:500; font-display:swap; }
`;

export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang='en'><head><style>{fontFaces}</style><link rel='preload' href={assetPath('/fonts/FoundersGrotesk-Regular.woff2')} as='font' type='font/woff2' crossOrigin='anonymous'/><link rel='preload' href={assetPath('/fonts/PPNeueMontreal-Variable.ttf')} as='font' type='font/ttf' crossOrigin='anonymous'/></head><body><a className='skip-link' href={withBasePath('#hero-heading')}>Skip to content</a>{children}<Feedback /></body></html>; }
