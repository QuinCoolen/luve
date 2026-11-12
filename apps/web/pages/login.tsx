import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/auth";
import { me, useLogin } from "@/api/generated/identity/endpoints";
import { ApiError, refreshSession } from "@/api/mutator/axios";
import { FieldErrors } from "@/components/field-errors";

/** Only allow same-site relative paths as a post-login destination. */
function safeNext(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default function Login() {
  const router = useRouter();
  const { signedIn } = useContext(AuthContext);
  const login = useLogin();
  const [error, setError] = useState<ApiError | null>(null);
  const next = safeNext(router.query.next);

  // Sent here by an SSR auth check? The access token may just have expired:
  // try the refresh cookie before asking for a password.
  useEffect(() => {
    if (!router.isReady || router.query.next === undefined) return;
    refreshSession()
      .then(() => me())
      .then((user) => {
        signedIn(user);
        void router.replace(next);
      })
      .catch(() => {
        /* no session: show the form */
      });
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const user = await login.mutateAsync({
        data: {
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        },
      });
      signedIn(user);
      await router.push(next);
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
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col items-center justify-center gap-4">
            {error?.generalErrors().map((message) => (
              <p key={message} className="text-red-500">
                {message}
              </p>
            ))}
            <Input type="email" placeholder="Email" name="email" autoComplete="email" required />
            <FieldErrors error={error} field="email" />
            <Input
              type="password"
              placeholder="Password"
              name="password"
              autoComplete="current-password"
              required
            />
            <FieldErrors error={error} field="password" />
            <Button className="place-self-end" type="submit" disabled={login.isPending}>
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
