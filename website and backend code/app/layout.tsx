import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Campus Calm | Mental Health Consultant',description:'College wellness support with an AI-guided chat, mood check-ins, coping exercises, and interactive FAQ.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
