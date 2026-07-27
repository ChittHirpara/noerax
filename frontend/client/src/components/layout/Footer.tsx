import { motion } from "motion/react";
import { ArrowUpRight, Mail } from "lucide-react";

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

export function Footer() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }
  };

  return (
    <motion.footer initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative bg-dharma-ink pt-32 pb-8 overflow-hidden border-t border-dharma-line-dark">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] bg-dharma-maroon/5 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] bg-dharma-flame/5 rounded-full blur-[100px]"
        />
      </div>

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Waitlist CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative group rounded-3xl overflow-hidden mb-32"
        >
          <div className="absolute inset-0 bg-dharma-ivory/5 border border-dharma-line-dark rounded-3xl backdrop-blur-sm" />
          {/* Animated glow on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 bg-gradient-to-r from-dharma-flame/10 via-dharma-gold/10 to-dharma-maroon/10 rounded-3xl blur-xl" />
          
          <div className="relative p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="font-serif text-4xl md:text-5xl text-dharma-ivory mb-6 tracking-tight">
                Ready to find your center?
              </h2>
              <p className="text-dharma-ivory-dim text-lg">
                Join our waitlist for early access. No spam, just ancient wisdom delivered directly to your modern life.
              </p>
            </div>
            
            <form className="w-full md:w-auto flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full sm:w-80 bg-dharma-ink-2/50 border border-dharma-line-dark rounded-full px-6 py-4 text-dharma-ivory placeholder:text-dharma-ivory/30 focus:outline-none focus:border-dharma-flame transition-colors"
              />
              <button className="px-8 py-4 bg-dharma-ivory text-dharma-ink font-medium rounded-full hover:bg-dharma-flame hover:text-white transition-all duration-300 whitespace-nowrap transform hover:scale-[1.02] active:scale-[0.98]">
                Join Waitlist
              </button>
            </form>
          </div>
        </motion.div>

        {/* Links Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-32"
        >
          <motion.div variants={itemVariants} className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 font-serif text-dharma-ivory text-3xl mb-6">
              <span className="text-dharma-flame text-4xl">☼</span>
              Noerax
            </div>
            <p className="text-dharma-ivory-dim mb-8 max-w-sm leading-relaxed">
              Ancient Indian wisdom translated for the modern mind. Find clarity in the chaos of the digital age.
            </p>
            <div className="flex gap-4">
              {[
                { Icon: TwitterIcon, href: "#" },
                { Icon: InstagramIcon, href: "https://www.instagram.com/noerax.ai" },
                { Icon: GithubIcon, href: "#" },
                { Icon: Mail, href: "#" }
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-dharma-line-dark flex items-center justify-center text-dharma-ivory-dim hover:text-dharma-ivory hover:border-dharma-ivory/30 hover:bg-dharma-ivory/5 transition-all duration-300">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {[
            {
              title: "Platform",
              links: ["Philosophy", "Library", "Daily Mantra", "Features", "Pricing"]
            },
            {
              title: "Resources",
              links: ["The Shop", "Journal", "Ancient Texts", "Meditation Guide", "FAQ"]
            },
            {
              title: "Company",
              links: ["About Us", "Careers", "Privacy Policy", "Terms of Service", "Contact"]
            }
          ].map((column, idx) => (
            <motion.div variants={itemVariants} key={idx}>
              <h4 className="text-dharma-ivory font-medium mb-6 uppercase tracking-widest text-xs">{column.title}</h4>
              <ul className="space-y-4">
                {column.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <a href="#" className="group inline-flex items-center gap-2 text-dharma-ivory-dim hover:text-dharma-ivory transition-colors text-sm">
                      {link}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Massive Footer Text */}
        <div className="relative pt-12 border-t border-dharma-line-dark overflow-hidden flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-[12vw] font-serif leading-none tracking-tighter text-dharma-ivory/5 select-none"
          >
            NOERAX
          </motion.h1>
          
          <div className="absolute bottom-0 left-0 w-full flex flex-col md:flex-row items-center justify-between text-xs text-dharma-ivory-dim/50 pb-2">
            <p>&copy; {new Date().getFullYear()} Noerax. All rights reserved.</p>
            <p className="flex items-center gap-1 mt-2 md:mt-0">
              Designed for the modern soul
            </p>
          </div>
        </div>

      </div>
    </motion.footer>
  );
}
