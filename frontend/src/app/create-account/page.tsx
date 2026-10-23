import { redirect } from 'next/navigation';

export default function CreateAccountRedirect() {
  redirect('/login?mode=register');
}
