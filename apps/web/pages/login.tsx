import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { userService } from "@/services/api";

export default function Login() {
  const router = useRouter();

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      await userService.login({ email: email as string, password: password as string });

      router.push("/");
    } catch (error) {
      console.error(error);
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
            <Input type="email" placeholder="Email" name="email" required />
            <Input type="password" placeholder="Password" name="password" required />
            <Button className="place-self-end" type="submit">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

