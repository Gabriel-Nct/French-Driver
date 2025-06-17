import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <LoginForm />
      </div>
    </div>
  );
}
