import { ReactNode } from 'react'
import { LandingFloatingActions } from './LandingFloatingActions'
import { LandingFooter } from './LandingFooter'
import { LandingHeader } from './LandingHeader'

type LandingPageShellProps = {
  children: ReactNode
  mainClassName?: string
}

export function LandingPageShell({
  children,
  mainClassName = 'page-transition',
}: LandingPageShellProps) {
  return (
    <>
      <LandingHeader />
      <main className={mainClassName}>{children}</main>
      <LandingFooter />
      <LandingFloatingActions />
    </>
  )
}
