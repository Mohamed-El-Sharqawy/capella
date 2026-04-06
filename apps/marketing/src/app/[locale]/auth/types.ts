export interface AuthPageProps {
  params: { locale: string };
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface AuthFormState {
  isLoading: boolean;
  error: string;
  showPassword: boolean;
}
