import { cn } from '@/lib/utils'
import { nunito } from '@/lib/fontesHome'

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(nunito.className, 'h-screen w-screen overflow-hidden flex flex-col bg-[#f6f9ff] text-tinta')}>
      {children}
    </div>
  )
}
