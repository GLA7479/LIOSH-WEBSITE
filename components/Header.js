import Link from "next/link";

export default function Header() {
  return (
    <header className="absolute top-0 left-0 w-full flex justify-center space-x-6 py-4 bg-black bg-opacity-40 text-white font-bold z-20">
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/tokenomics">Tokenomics</Link>
      <Link href="/presale">Presale</Link>
      <Link href="/staking">Staking</Link>
      <Link href="/gallery">Gallery</Link>
      <Link href="/whitepaper">Whitepaper</Link>
      <Link href="/contact">Contact</Link>
    </header>
  );
}