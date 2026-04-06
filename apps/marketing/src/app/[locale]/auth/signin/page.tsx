import { SignInClient } from "./client";

interface Props {
  params: { locale: string };
}

export default function SignInPage({ params }: Props) {
  return <SignInClient params={params} />;
}
