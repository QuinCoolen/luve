import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/auth";
import { useUpdateMe } from "@/api/generated/users/endpoints";
import { ApiError } from "@/api/mutator/axios";
import { FieldErrors } from "@/components/field-errors";
import { getSessionUser, redirectToLogin } from "@/lib/session";

/** Only signed-in users can pick a username. */
export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!(await getSessionUser(context))) {
    return redirectToLogin(context);
  }
  return { props: {} };
};

/**
 * Step 2 of signing up. The account (email + password) lives in the auth
 * service; the username belongs to your profile in the users service.
 */
export default function ChooseUsername() {
  const router = useRouter();
  const { signedIn } = useContext(AuthContext);
  const updateMe = useUpdateMe();
  const [error, setError] = useState<ApiError | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const user = await updateMe.mutateAsync({
        data: { username: String(formData.get("username") ?? "") },
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
          <CardTitle className="text-2xl font-bold">Choose a username</CardTitle>
          <CardDescription>This is how other bidders and sellers see you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center gap-4">
            <Input type="text" placeholder="Username" name="username" autoComplete="username" required />
            <FieldErrors error={error} field="username" />
            {error?.generalErrors().map((message) => (
              <p key={message} className="w-full text-sm text-red-500">
                {message}
              </p>
            ))}
            <Button className="place-self-end" type="submit" disabled={updateMe.isPending}>
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
