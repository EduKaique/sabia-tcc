import Image from 'next/image'
import Link from 'next/link'
import { Fredoka, Nunito } from 'next/font/google'
import { BookOpen } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import heroBlocos from '@/public/images/home/hero-blocos.jpg'
import styles from '@/styles/home.module.css'

const fredoka = Fredoka({ subsets: ['latin'], weight: ['500', '600', '700'] })
const nunito = Nunito({ subsets: ['latin'], weight: ['500', '700', '800'] })

export default function Home() {
  return (
    <main
      className={cn(
        nunito.className,
        styles.page,
        'relative isolate flex min-h-dvh flex-col items-center overflow-hidden',
      )}
    >
      <Decoracao />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-6 pt-12 text-center sm:pt-16 lg:pt-20">
        <div
          className={cn(
            styles.rise,
            styles.brandBlock,
            fredoka.className,
            'mb-6 inline-flex items-center gap-2 rounded-xl px-4 py-1.5 text-base font-semibold text-white',
          )}
        >
          <BookOpen size={18} aria-hidden="true" />
          Sabiá
        </div>

        <h1
          className={cn(
            styles.rise,
            styles.delay1,
            fredoka.className,
            'text-[2.5rem] leading-[1.05] font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl',
          )}
        >
          Programar é{' '}
          <span className="text-[#c4500f]">brincar</span> de{' '}
          <span className="text-[#2f55c0]">criar!</span>
        </h1>

        <p
          className={cn(
            styles.rise,
            styles.delay2,
            'mt-4 max-w-md text-lg leading-snug font-medium text-pretty text-[#3a4266] sm:mt-5 sm:max-w-xl sm:text-xl',
          )}
        >
          Arraste blocos, monte seus próprios jogos e histórias e ganhe pontos a cada desafio.
        </p>

        <div className={cn(styles.rise, styles.delay3, 'mt-8')}>
          <div className={styles.pulse}>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: 'lg' }),
                fredoka.className,
                'h-auto min-h-14 rounded-full border-2 border-[#1e2546] bg-[#f9bd15] px-9 py-3 text-xl font-bold text-[#1e2546]',
                'shadow-[0_6px_0_#1e2546] transition-[transform,box-shadow,background-color] duration-150',
                'hover:-translate-y-0.5 hover:bg-[#ffc933] hover:shadow-[0_8px_0_#1e2546]',
                'active:translate-y-1 active:shadow-[0_2px_0_#1e2546]',
                'focus-visible:border-[#1e2546] focus-visible:ring-4 focus-visible:ring-[#426cda] focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f9ff]',
              )}
            >
              Bora começar!
            </Link>
          </div>
        </div>
      </div>

      <div className={cn(styles.heroArt, 'mt-auto pt-6')} aria-hidden="true">
        <div className={cn(styles.float, styles.artMask, 'mix-blend-multiply')}>
          <Image
            src={heroBlocos}
            alt=""
            priority
            sizes="(min-width: 768px) 920px, 135vw"
            className="h-auto w-full"
          />
        </div>
      </div>
    </main>
  )
}

/** Estrelinhas, bolinhas e confetes nas cores das peças. Puramente decorativo. */
function Decoracao() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
    >
      <defs>
        <path
          id="estrela"
          d="M0 -10 L2.6 -2.6 L10 0 L2.6 2.6 L0 10 L-2.6 2.6 L-10 0 L-2.6 -2.6 Z"
        />
      </defs>

      {/* estrelinhas */}
      <use href="#estrela" x="8%" y="14%" fill="#f9bd15" className={styles.twinkle} />
      <use href="#estrela" x="91%" y="10%" fill="#8d4ce6" className={styles.twinkle} style={{ animationDelay: '1.1s' }} />
      <use href="#estrela" x="86%" y="42%" fill="#60bb75" className={styles.twinkle} style={{ animationDelay: '0.6s' }} />
      <use href="#estrela" x="12%" y="48%" fill="#426cda" className={styles.twinkle} style={{ animationDelay: '1.8s' }} />

      {/* bolinhas */}
      <circle cx="18%" cy="8%" r="5" fill="#fe7629" opacity="0.7" />
      <circle cx="93%" cy="52%" r="6" fill="#f9bd15" opacity="0.8" />
      <circle cx="5%" cy="32%" r="4" fill="#8d4ce6" opacity="0.6" />
      <circle cx="95%" cy="30%" r="4" fill="#426cda" opacity="0.6" />
      <circle cx="70%" cy="6%" r="3" fill="#60bb75" opacity="0.7" />

      {/* confetes */}
      <rect x="24%" y="22%" width="12" height="5" rx="2.5" fill="#60bb75" opacity="0.7" style={{ transform: 'rotate(-25deg)', transformBox: 'fill-box', transformOrigin: 'center' }} />
      <rect x="74%" y="34%" width="12" height="5" rx="2.5" fill="#fe7629" opacity="0.7" style={{ transform: 'rotate(30deg)', transformBox: 'fill-box', transformOrigin: 'center' }} />
      <rect x="4%" y="22%" width="10" height="4" rx="2" fill="#f9bd15" opacity="0.8" style={{ transform: 'rotate(15deg)', transformBox: 'fill-box', transformOrigin: 'center' }} />
    </svg>
  )
}
