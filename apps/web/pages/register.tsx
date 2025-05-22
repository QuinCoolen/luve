import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { userService } from "@/services/api";
import { useContext } from "react";
import { AuthContext } from "@/context/auth";

export default function Register() {
  const router = useRouter();

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      await userService.register({ userName: username as string, email: email as string, password: password as string });
      router.push("/login");
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-36">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="flex flex-col items-center justify-center gap-4">
            <Input type="text" placeholder="Username" name="username" required />
            <Input type="email" placeholder="Email" name="email" required />
            <Input type="password" placeholder="Password" name="password" required />
            <Button className="place-self-end" type="submit">Register</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

