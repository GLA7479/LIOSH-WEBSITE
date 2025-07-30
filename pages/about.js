import Layout from "../components/Layout";
import { motion } from "framer-motion";

export default function About() {
  return (
    <Layout video="/videos/about-bg.mp4"> {/* ווידאו ברקע */}
      <motion.div
        className="flex flex-col items-center justify-center h-[70vh] px-6 text-center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2 }}
      >
        <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-4">
          About LIOSH
        </h1>
        <p className="text-lg md:text-2xl max-w-3xl">
          LIOSH is the ultimate meme token inspired by the real Shiba Inu dog,
          LIO! Our goal is to combine community power, fun, and blockchain
          technology to create something truly unique.
        </p>
      </motion.div>
    </Layout>
  );
}
