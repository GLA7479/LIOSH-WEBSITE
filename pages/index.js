import Layout from "../components/Layout";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <Layout page="home">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white h-[80vh] flex flex-col justify-center items-center text-center px-6 py-16">
        <motion.h1
          className="text-6xl md:text-7xl font-extrabold mb-6 text-yellow-500"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          LIOSH - The Next Big Thing in Cryptocurrency
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          viewport={{ once: true }}
        >
          Be part of the crypto revolution with LIOSH – The meme coin with real value. The future of cryptocurrency starts here.
        </motion.p>
        <motion.a
          href="/presale"
          className="bg-yellow-500 text-black py-4 px-10 rounded-full text-xl font-semibold shadow-md hover:bg-yellow-600 transition"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          viewport={{ once: true }}
        >
          Join the Presale Now
        </motion.a>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-6xl mx-auto text-center px-6">
          <motion.h2
            className="text-4xl font-semibold text-yellow-500 mb-6"
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            What is LIOSH?
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8"
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            viewport={{ once: true }}
          >
            LIOSH is more than just a meme coin. Inspired by Lio, the real Shiba Inu, it is a community-driven cryptocurrency that brings real value to its holders. We are building the future of cryptocurrency by offering transparency, utility, and opportunity for everyone.
          </motion.p>
          <motion.img
            src="/images/shiba-inu.jpg"
            alt="Lio the Shiba Inu"
            className="rounded-xl shadow-lg mx-auto w-72 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          />
        </div>
      </section>

      {/* Tokenomics Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto text-center px-6">
          <motion.h2
            className="text-4xl font-semibold text-yellow-500 mb-6"
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            Tokenomics
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            viewport={{ once: true }}
          >
            LIOSH is designed with sustainability and growth in mind. Here’s how our tokenomics work:
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div
              className="bg-gray-700 text-yellow-500 p-8 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold">40%</h3>
              <p className="text-xl">Presale</p>
            </motion.div>
            <motion.div
              className="bg-gray-700 text-yellow-500 p-8 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold">30%</h3>
              <p className="text-xl">Team & Advisors</p>
            </motion.div>
            <motion.div
              className="bg-gray-700 text-yellow-500 p-8 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.4 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold">20%</h3>
              <p className="text-xl">Staking Rewards</p>
            </motion.div>
            <motion.div
              className="bg-gray-700 text-yellow-500 p-8 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold">10%</h3>
              <p className="text-xl">Reserve</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-r from-gray-900 to-black text-white py-20 text-center">
        <motion.h2
          className="text-4xl font-semibold mb-6"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          Be Part of the Future of Crypto
        </motion.h2>
        <motion.p
          className="text-lg md:text-xl max-w-3xl mx-auto mb-8"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          viewport={{ once: true }}
        >
          LIOSH is not just a meme coin; it's the future. Join us on this exciting journey and start your adventure in cryptocurrency today.
        </motion.p>
        <motion.a
          href="/presale"
          className="bg-yellow-500 text-black py-4 px-10 rounded-full text-xl font-semibold shadow-lg hover:bg-yellow-600 transition"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          viewport={{ once: true }}
        >
          Join the Presale Now
        </motion.a>
      </section>
    </Layout>
  );
}
