import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthContext } from "@/context/auth";
import { useRegister } from "@/api/generated/identity/endpoints";
import { ApiError } from "@/api/mutator/axios";
import { FieldErrors } from "@/components/field-errors";

export default function Register() {
  const router = useRouter();
  const { signedIn } = useContext(AuthContext);
  const register = useRegister();
  const [error, setError] = useState<ApiError | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setConfirmError(null);

    const formData = new FormData(e.currentTarget);
    const password = String(formData.get("password") ?? "");
    if (password !== formData.get("confirmPassword")) {
      setConfirmError("Passwords do not match");
      return;
    }

    try {
      // Registering also signs you in (identity sets the session cookies).
      const user = await register.mutateAsync({
        data: {
          username: String(formData.get("username") ?? ""),
          email: String(formData.get("email") ?? ""),
          password,
        },
      });
      signedIn(user);
      await router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err);
      } else {
        console.error(err);
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-36">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleRegister}
            className="flex flex-col items-center justify-center gap-4"
          >
            <Input
              type="text"
              placeholder="Username"
              name="username"
              autoComplete="username"
              required
            />
            <FieldErrors error={error} field="username" />
            <Input type="email" placeholder="Email" name="email" required />
            <FieldErrors error={error} field="email" />

            <div className="relative w-full">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            <FieldErrors error={error} field="password" />

            <div className="relative w-full">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                name="confirmPassword"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            {confirmError && <p className="w-full text-sm text-red-500">{confirmError}</p>}
            {error?.generalErrors().map((message) => (
              <p key={message} className="w-full text-sm text-red-500">
                {message}
              </p>
            ))}
            <Button className="place-self-end" type="submit" disabled={register.isPending}>
              Register
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
