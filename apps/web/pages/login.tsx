import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { userService } from "@/services/api";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/auth";
import { NotFoundError, ValidationError } from "@/types/user";

export default function Login() {
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const user = await userService.login({ email: email as string, password: password as string });
      if (!user) {
        throw new Error("Failed to login");
      }
      login();
      router.push("/");
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors(error.errors);
      } else if (error instanceof NotFoundError) {
        setErrors({ NotFound: [error.message] });
      } else {
        console.error(error);
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-36">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col items-center justify-center gap-4">
            {errors.NotFound && errors.NotFound.map((error, index) => (
              <p key={index} className="text-red-500">{error}</p>
            ))}
            <Input type="email" placeholder="Email" name="email" required />
            {errors.Email && errors.Email.map((error, index) => (
              <p key={index} className="text-red-500">{error}</p>
            ))}
            <Input type="password" placeholder="Password" name="password" required />
            {errors.Password && errors.Password.map((error, index) => (
              <p key={index} className="text-red-500">{error}</p>
            ))}
            <Button className="place-self-end" type="submit">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

