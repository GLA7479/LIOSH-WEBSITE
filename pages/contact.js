import Layout from "../components/Layout";
import { motion } from "framer-motion";

export default function Contact() {
  return (
    <Layout page="contact">
      <motion.main
        className="relative min-h-screen flex flex-col items-center text-white p-0 m-0 overflow-hidden pt-[114px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/videos/contact-bg.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/50 z-10"></div>

        <motion.h1
          className="text-4xl sm:text-5xl font-extrabold mb-6 flex items-center justify-center gap-2 z-20"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <span>📩</span>
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Contact Us
          </span>
        </motion.h1>

        <p className="text-lg max-w-2xl text-center mb-8 z-20">
          Have questions about LIOSH Token? Reach out to us through any of the platforms below!
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-lg font-semibold z-20">
          {[
            { text: "📧 Email", color: "bg-yellow-400 hover:bg-yellow-500" },
            { text: "📷 Instagram", color: "bg-pink-500 hover:bg-pink-600" },
            { text: "🌐 Facebook", color: "bg-blue-500 hover:bg-blue-600" },
            { text: "🐦 Twitter", color: "bg-sky-500 hover:bg-sky-600" },
            { text: "💬 Discord", color: "bg-indigo-500 hover:bg-indigo-600" },
            { text: "📲 Telegram", color: "bg-green-500 hover:bg-green-600" },
          ].map((btn, i) => (
            <a
              key={i}
              href="https://www.instagram.com/liotheshiba21"
              target="_blank"
              rel="noopener noreferrer"
              className={`${btn.color} text-black px-6 py-3 rounded-lg transition`}
            >
              {btn.text}
            </a>
          ))}
        </div>
      </motion.main>
    </Layout>
  );
}
