import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="mx-auto max-w-md">
      <SignIn appearance={{ elements: { formButtonPrimary: 'bg-primary text-primary-foreground' } }} />
    </div>
  );
}


