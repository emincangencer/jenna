import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-sans sm:p-20">
      <main className="row-start-2 flex flex-col items-center gap-[32px] sm:items-start">
        <div className="flex flex-col items-center gap-4 sm:items-start">
          <h1 className="text-3xl font-bold">Welcome</h1>
          <Link href="/chat" passHref>
            <Button className="inline-flex items-center px-4 py-2">Go to Chat</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
