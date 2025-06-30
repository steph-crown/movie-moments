import Link from "next/link";

export default function Home() {
  return (
    <div>
      <p className="text-red-500">ade</p>
      <Link href={"/signup"}>Create a room</Link>
      <Link href={"/login"}>Log in</Link>
    </div>
  );
}
