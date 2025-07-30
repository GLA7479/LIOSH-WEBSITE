import Layout from "../components/Layout";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Home() {
  const logoAnimation = {
    animate: {
      rotate: [0, 360],
      scale: [1, 1.1, 1],
      filter: [
        "drop-shadow(0px 0px 5px rgba(255,255,0,0.4))",
        "drop-shadow(0px 0px 15px rgba(255,255,0,0.7))",
        "drop-shadow(0px 0px 5px rgba(255,255,0,0.4))",
      ],
    },
    transition: {
      repeat: Infinity,
      duration: 5,
      ease: "linear",
    },
  };

  return (
    <Layout page="home">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex flex-col justify-start items-center text-center px-6 bg-gradient-to-b from-black via-gray-900 to-black pt-20">
        <motion.h1
          className="mb-6 drop-shadow-lg leading-tight flex flex-col items-center"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          {/* שורה ראשונה עם לוגואים משני הצדדים */}
          <span className="flex items-center gap-6">
            <motion.div
              {...logoAnimation}
              whileHover={{
                scale: 1.5,
                filter:
                  "drop-shadow(0px 0px 25px rgba(255,255,0,1))",
              }}
            >
              <Image
                src="/images/logo2.png"
                alt="Liosh Logo Left"
                width={90}
                height={90}
                className="inline-block"
              />
            </motion.div>

            <span className="text-6xl md:text-8xl font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              LIOSH
            </span>

            <motion.div
              {...logoAnimation}
              whileHover={{
                scale: 1.5,
                filter:
                  "drop-shadow(0px 0px 25px rgba(255,255,0,1))",
              }}
            >
              <Image
                src="/images/logo2.png"
                alt="Liosh Logo Right"
                width={90}
                height={90}
                className="inline-block"
              />
            </motion.div>
          </span>

          {/* שורה שנייה מוגדלת */}
          <span className="block text-3xl md:text-4xl lg:text-5xl mt-3 font-semibold bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-md">
            The Real Shiba Meme Coin
          </span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-2xl text-gray-300 max-w-2xl mb-8"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          viewport={{ once: true }}
        >
          Join the revolution of meme coins with real utility and real community.
          Be an early part of the LIOSH movement!
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <a
            href="/presale"
            className="bg-yellow-500 hover:bg-yellow-600 text-black py-3 px-8 rounded-full text-xl font-semibold shadow-lg transition"
          >
            🚀 Join Presale
          </a>
          <a
            href="/about"
            className="bg-transparent border-2 border-yellow-500 hover:bg-yellow-500 hover:text-black text-yellow-500 py-3 px-8 rounded-full text-xl font-semibold transition"
          >
            Learn More
          </a>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-black text-center">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            className="text-4xl font-bold text-yellow-500 mb-4"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            🐕 What is LIOSH?
          </motion.h2>
          <motion.p
            className="text-gray-300 text-lg mb-8"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            LIOSH is a next-gen meme coin inspired by Lio, the real Shiba Inu.
            We combine fun, community, and real-world utility to create a token
            that’s here to stay.
          </motion.p>
          <motion.img
            src="/images/shiba-inu.jpg"
            alt="Lio the Shiba Inu"
            className="rounded-2xl shadow-xl w-64 mx-auto hover:scale-105 transition-transform"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          />
        </div>
      </section>

      {/* Tokenomics Section */}
      <section className="py-20 bg-black text-center">
        <motion.h2
          className="text-4xl font-bold text-yellow-500 mb-6"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          📊 Tokenomics
        </motion.h2>
        <p className="text-gray-300 text-lg mb-10 max-w-3xl mx-auto">
          A sustainable and fair token distribution designed to reward early
          supporters and long-term holders.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 max-w-6xl mx-auto">
          {[
            { percent: "40%", label: "Presale" },
            { percent: "30%", label: "Team & Advisors" },
            { percent: "20%", label: "Staking Rewards" },
            { percent: "10%", label: "Reserve" },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="bg-gray-800 rounded-xl p-6 shadow-lg hover:scale-105 transition-transform"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: i * 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-extrabold text-yellow-500">
                {item.percent}
              </h3>
              <p className="text-xl text-gray-300">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-center">
        <motion.h2
          className="text-4xl font-extrabold mb-4"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Be Part of the LIOSH Journey 🚀
        </motion.h2>
        <motion.p
          className="text-lg mb-6 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          Secure your place in the future of meme coins with real value and
          strong community support.
        </motion.p>
        <a
          href="/presale"
          className="bg-black text-yellow-500 px-10 py-4 rounded-full font-bold text-xl shadow-lg hover:bg-gray-900 transition"
        >
          Join Presale Now
        </a>
      </section>
    </Layout>
  );
}
