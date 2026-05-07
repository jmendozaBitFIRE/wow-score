import { LoginForm } from './_components/login-form'

export const metadata = { title: 'Iniciar sesión — WowScore' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { registered } = await searchParams
  return <LoginForm registered={registered === 'true'} />
}
