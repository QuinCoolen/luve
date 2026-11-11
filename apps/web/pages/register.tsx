import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { userService } from "@/services/api";
import { ValidationError } from "@/types/user";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const router = useRouter();
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setErrors({ ConfirmPassword: ["Passwords do not match"] });
      return;
    }

    try {
      await userService.register({
        username: username as string,
        email: email as string,
        password: password as string,
      });
      router.push("/login");
    } catch (error) {
      console.log("Error");
      if (error instanceof ValidationError) {
        console.log("ValidationError");
        setErrors(error.errors);
        console.log(errors);
      } else {
        console.error(error);
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
              required
            />
            {errors.UserName &&
              errors.UserName.map((error, index) => (
                <p key={index} className="text-red-500">
                  {error}
                </p>
              ))}
            <Input type="email" placeholder="Email" name="email" required />
            {errors.Email &&
              errors.Email.map((error, index) => (
                <p key={index} className="text-red-500">
                  {error}
                </p>
              ))}

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
            {errors.Password &&
              errors.Password.map((error, index) => (
                <p key={index} className="text-red-500">
                  {error}
                </p>
              ))}

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
            {errors.ConfirmPassword &&
              errors.ConfirmPassword.map((error, index) => (
                <p key={index} className="text-red-500">
                  {error}
                </p>
              ))}
            <Button className="place-self-end" type="submit">
              Register
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
