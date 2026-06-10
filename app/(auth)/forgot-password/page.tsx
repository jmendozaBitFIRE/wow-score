import { ForgotForm } from './_components/forgot-form'

export const metadata = { title: 'Recuperar contraseña — WowScore' }

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { success } = await searchParams
  return <ForgotForm success={success === 'true'} />
}
