import { SignUpClient } from "./client";

interface Props {
  params: { locale: string };
}

export default function SignUpPage({ params }: Props) {
  return <SignUpClient params={params} />;
}
