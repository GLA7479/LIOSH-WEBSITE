import Layout from "../components/Layout";
import { motion } from "framer-motion";

export default function Contact() {
  return (
    <Layout>
      <motion.div
        className="flex flex-col items-center justify-center h-[70vh] px-6 text-center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2 }}
      >
        <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-4">
          Contact Us
        </h1>
        <p className="text-lg md:text-2xl max-w-3xl mb-8">
          Get in touch with us for any inquiries or support. We're here to help.
        </p>
        
        {/* כפתורים יצירת קשר */}
        <div className="flex flex-col space-y-4 mb-8">
          <a
            href="https://www.instagram.com/liotheshiba21/?igsh=NTljMDY4N2EzMWJu#"
            className="bg-yellow-400 text-black py-2 px-6 rounded-md text-lg hover:bg-yellow-500 transition"
          >
            Email Us
          </a>
          <a
            href="https://www.instagram.com/liotheshiba21/?igsh=NTljMDY4N2EzMWJu#"
            className="bg-yellow-400 text-black py-2 px-6 rounded-md text-lg hover:bg-yellow-500 transition"
          >
            Call Us
          </a>
          <a
            href="https://www.instagram.com/liotheshiba21/?igsh=NTljMDY4N2EzMWJu#"
            className="bg-yellow-400 text-black py-2 px-6 rounded-md text-lg hover:bg-yellow-500 transition"
          >
            Contact Us on WhatsApp
          </a>
          <a
            href="https://www.instagram.com/liotheshiba21/?igsh=NTljMDY4N2EzMWJu#"
            className="bg-yellow-400 text-black py-2 px-6 rounded-md text-lg hover:bg-yellow-500 transition"
          >
            Contact Form
          </a>
        </div>

        {/* כפתורים לרשתות חברתיות */}
        <div className="flex space-x-6">
          <a
            href="https://www.instagram.com/liotheshiba21/?igsh=NTljMDY4N2EzMWJu#"
            target="_blank" rel="noopener noreferrer"
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition"
          >
            Twitter
          </a>
          <a
            href="https://www.instagram.com/liotheshiba21/?igsh=NTljMDY4N2EzMWJu#"
            target="_blank" rel="noopener noreferrer"
            className="bg-blue-700 text-white p-3 rounded-full hover:bg-blue-800 transition"
          >
            Facebook
          </a>
          <a
            href="https://www.instagram.com/liotheshiba21/?igsh=NTljMDY4N2EzMWJu#"
            target="_blank" rel="noopener noreferrer"
            className="bg-pink-600 text-white p-3 rounded-full hover:bg-pink-700 transition"
          >
            Instagram
          </a>
          <a
            href="https://www.instagram.com/liotheshiba21/?igsh=NTljMDY4N2EzMWJu#"
            target="_blank" rel="noopener noreferrer"
            className="bg-[#7289DA] text-white p-3 rounded-full hover:bg-[#5B6EAE] transition"
          >
            Discord
          </a>
          <a
            href="https://www.instagram.com/liotheshiba21/?igsh=NTljMDY4N2EzMWJu#"
            target="_blank" rel="noopener noreferrer"
            className="bg-[#0088cc] text-white p-3 rounded-full hover:bg-[#0077b5] transition"
          >
            Telegram
          </a>
        </div>
      </motion.div>
    </Layout>
  );
}
