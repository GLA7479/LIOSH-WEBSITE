
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    fetch("/api/gallery")
      .then((res) => res.json())
      .then((data) => {
        const images = data.images.map((src) => ({ type: "image", src }));
        const videos = data.videos.map((src) => ({ type: "video", src }));
        setItems([...images, ...videos]);
      });
  }, []);

  const openModal = (i) => setSelectedIndex(i);
  const closeModal = () => setSelectedIndex(null);
  const prevItem = () =>
    setSelectedIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  const nextItem = () =>
    setSelectedIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));

  return (
    <Layout page="gallery">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/gallery-bg.mp4" type="video/mp4" />
      </video>

      <motion.main
        className="relative min-h-screen flex flex-col items-center justify-center p-6 text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-black/30 -z-10"></div>

        <motion.h1
          className="text-4xl sm:text-5xl font-extrabold mb-6 flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span>🐾</span>
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent">
            LIOSH Gallery
          </span>
        </motion.h1>

        {items.length === 0 ? (
          <p className="text-gray-300">Loading gallery...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="cursor-pointer rounded-lg overflow-hidden hover:scale-105 transform transition"
                onClick={() => openModal(index)}
              >
                {item.type === "image" ? (
                  <img
                    src={item.src}
                    alt={`media-${index}`}
                    className="w-40 h-40 object-cover"
                  />
                ) : (
                  <video
                    src={item.src}
                    className="w-40 h-40 object-cover"
                    muted
                    playsInline
                  />
                )}
              </motion.div>
            ))}
          </div>
        )}

        {selectedIndex !== null && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <motion.div
              className="relative max-w-3xl max-h-[80vh]"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {items[selectedIndex].type === "image" ? (
                <img
                  src={items[selectedIndex].src}
                  className="w-[900px] h-[600px] object-contain rounded-lg mx-auto"
                />
              ) : (
                <video
                  src={items[selectedIndex].src}
                  autoPlay
                  controls
                  className="w-[900px] h-[600px] object-contain rounded-lg mx-auto"
                />
              )}

              <button
                onClick={closeModal}
                className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
              >
                ✖
              </button>
              <button
                onClick={prevItem}
                className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-red-500 text-white px-3 py-2 text-2xl rounded-full hover:bg-red-600"
              >
                ⬅
              </button>
              <button
                onClick={nextItem}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-red-500 text-white px-3 py-2 text-2xl rounded-full hover:bg-red-600"
              >
                ➡
              </button>
            </motion.div>
          </div>
        )}
      </motion.main>
    </Layout>
  );
}
