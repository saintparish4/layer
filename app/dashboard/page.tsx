import { auth } from "@/directive/auth";
import { headers } from "next/headers";

export default async function Dashboard() {
    const session = await auth.api.getSession({ headers: await headers() });
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Welcome, {session?.user?.name}!</h1>
            <p className="text-gray-600">You are logged in as {session?.user?.email}</p>
        </div>
    )
}


