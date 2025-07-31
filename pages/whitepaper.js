import { motion } from "framer-motion";
import Layout from "../components/Layout";


export default function Whitepaper() {
  return (
    <Layout page="whitepaper">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/whitepaper-bg.mp4" type="video/mp4" />
      </video>
    <>
      <motion.main
        className="relative min-h-screen text-white flex flex-col items-center justify-center p-6 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/videos/whitepaper-bg.mp4"
        />
        <div className="absolute inset-0 bg-black bg-opacity-70 z-0"></div>

        <div className="relative z-10 text-center max-w-xl">
          <h1 className="text-4xl font-extrabold mb-6 flex items-center justify-center gap-2">
            <span>📄</span>
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
              LIOSH Whitepaper
            </span>
          </h1>

          <p className="mb-4 text-lg">
            Discover everything about LIOSH Token – tokenomics, roadmap, and the vision behind the project.
          </p>

          <button className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold text-lg hover:bg-yellow-500 transition transform hover:scale-105">
            Download PDF
          </button>
        </div>
      </motion.main>
    </>
    </Layout>
  );
}
