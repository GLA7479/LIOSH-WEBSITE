import { motion } from "framer-motion";

export default function Contact() {
  return (
    <div className="relative w-full min-h-screen">
      {/* ווידאו כרקע */}
      <video
        className="background-video"
        autoPlay
        loop
        muted
        playsInline
        src="/videos/contact-bg.mp4"
        type="video/mp4"
      />
      
      {/* תוכן הדף */}
      <motion.div
        className="flex flex-col items-center justify-center h-[70vh] px-6 text-center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2 }}
      >
        <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-4">
          Contact Us
        </h1>
        <p className="text-lg md:text-2xl max-w-3xl">
          Get in touch with us for any inquiries or support. We're here to help.
        </p>
      </motion.div>
    </div>
  );
}

