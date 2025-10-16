import { Suspense } from "react";
import SigninForm from "./signin-form";

export default function SigninPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <SigninForm />
    </Suspense>
  );
}
