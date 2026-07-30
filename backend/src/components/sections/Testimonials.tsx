import { motion } from "motion/react";

const testimonials = [
  {
    quote: "It feels like having a deeply wise mentor in my pocket. When my anxiety peaks, Noerax helps me find ground again.",
    name: "Elena R.",
    role: "Product Designer",
    avatar: "E",
    color: "from-orange-500 to-yellow-500",
  },
  {
    quote: "I've tried every meditation app. This is different. It doesn't just tell me to breathe, it helps me understand *why* I'm stressed.",
    name: "James T.",
    role: "Software Engineer",
    avatar: "J",
    color: "from-blue-500 to-purple-500",
  },
  {
    quote: "Beautiful, minimal, and profound. The interface itself is calming, let alone the actual conversations.",
    name: "Sarah M.",
    role: "Student",
    avatar: "S",
    color: "from-emerald-500 to-teal-500",
  },
  {
    quote: "The Bhagavad Gita explanations actually make sense now. Never thought I'd relate to 5000-year-old texts so deeply.",
    name: "Arjun K.",
    role: "Entrepreneur",
    avatar: "A",
    color: "from-pink-500 to-rose-500",
  },
  {
    quote: "The journal feature is unreal — the AI caught things about myself that took me years in therapy to understand.",
    name: "Maya L.",
    role: "Writer",
    avatar: "M",
    color: "from-violet-500 to-indigo-500",
  },
  {
    quote: "Noerax is the intersection of spirituality and technology I didn't know I needed. Game changer.",
    name: "Rohan S.",
    role: "UX Researcher",
    avatar: "R",
    color: "from-amber-500 to-orange-500",
  },
];

function TestimonialCard({ item }: { item: typeof testimonials[0] }) {
  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[340px] md:w-[400px] p-5 sm:p-7 rounded-2xl bg-dharma-ink-2 border border-dharma-line-dark hover:border-dharma-flame/20 transition-colors duration-300 mx-2 sm:mx-3 group">
      {/* Stars */}
      <div className="flex gap-1 mb-4 sm:mb-5">
        {Array(5).fill(0).map((_, i) => (
          <span key={i} className="text-dharma-gold text-xs sm:text-sm">★</span>
        ))}
      </div>

      <p className="text-dharma-ivory/80 text-sm sm:text-base leading-relaxed italic mb-5 sm:mb-7 font-serif">
        "{item.quote}"
      </p>

      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 ring-2 ring-dharma-line-dark group-hover:ring-dharma-flame/20 transition-all`}>
          <span className="text-white font-bold text-xs sm:text-sm">{item.avatar}</span>
        </div>
        <div>
          <h4 className="text-dharma-ivory font-semibold text-xs sm:text-sm">{item.name}</h4>
          <p className="text-dharma-ivory-dim text-[11px] sm:text-xs">{item.role}</p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const doubled = [...testimonials, ...testimonials];

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      id="testimonials"
      className="py-32 bg-dharma-ink relative overflow-hidden"
    >
      {/* Gradient fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #09090b, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #09090b, transparent)' }} />

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl mb-12 sm:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="inline-block text-dharma-flame text-xs font-semibold tracking-[0.3em] uppercase mb-4">
            Community Voices
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl text-dharma-ivory mb-6">
            Loved by seekers <span className="gradient-text">everywhere.</span>
          </h2>
          <p className="text-dharma-ivory-dim text-lg max-w-xl mx-auto">
            Thousands of seekers finding clarity, purpose, and peace through Noerax.
          </p>
        </motion.div>
      </div>

      {/* Row 1 — left to right */}
      <div className="relative overflow-hidden mb-5">
        <div className="flex" style={{ animation: 'marquee 35s linear infinite' }}>
          {doubled.map((item, i) => (
            <TestimonialCard key={`row1-${i}`} item={item} />
          ))}
        </div>
      </div>

      {/* Row 2 — right to left */}
      <div className="relative overflow-hidden">
        <div className="flex" style={{ animation: 'marquee 40s linear infinite reverse' }}>
          {[...doubled].reverse().map((item, i) => (
            <TestimonialCard key={`row2-${i}`} item={item} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}




