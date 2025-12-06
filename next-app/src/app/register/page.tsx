import AuthPage from "@/components/AuthPage";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "สมัครสมาชิก",
};

export default function RegisterPage() {
    return <AuthPage />;
}
