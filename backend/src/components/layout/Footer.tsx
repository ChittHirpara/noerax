import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Instagram, Linkedin, Twitter, Github, Mail, X, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import noeraxLogo from "../../assets/noerax-logo.png";

export function Footer() {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

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

  const handleLinkClick = (linkName: string) => {
    if (linkName === "Privacy Policy") {
      setLegalModal("privacy");
      return;
    }
    if (linkName === "Terms of Service") {
      setLegalModal("terms");
      return;
    }
    if (linkName === "Decision Guide" || linkName === "Frameworks") {
      const el = document.getElementById("features");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (linkName === "Contact") {
      window.location.href = "mailto:support@noerax.com?subject=Inquiry%20from%20Noerax";
      return;
    }

    const sectionMap: Record<string, string> = {
      "Philosophy": "philosophy",
      "Library": "library",
      "Notes": "journal",
      "Features": "features",
      "About Us": "home"
    };

    const targetId = sectionMap[linkName];
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
      className="bg-dharma-ink pt-32 pb-12 border-t border-dharma-line-dark relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-dharma-flame/5 blur-[150px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-32"
        >
          <motion.div variants={itemVariants} className="col-span-2 lg:col-span-2">
            <div className="flex items-center mb-6">
              <img src={noeraxLogo} alt="Noerax" className="h-16 md:h-20 w-auto object-contain -ml-2" style={{ filter: 'brightness(1.15)' }} />
            </div>
            <p className="text-dharma-ivory-dim mb-6 max-w-sm leading-relaxed">
              Ancient wisdom translated for the modern mind. Find clarity in the chaos of the digital age.
            </p>

            <div className="flex gap-4">
              {[
                { Icon: Instagram, href: "https://www.instagram.com/noerax.ai" },
                { Icon: Linkedin, href: "https://www.linkedin.com/company/dharmax-ai/" }
              ].map(({ Icon, href }, i) => (
                <a 
                  key={i} 
                  href={href} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-dharma-line-dark flex items-center justify-center text-dharma-ivory-dim hover:text-dharma-ivory hover:border-dharma-flame/40 hover:bg-dharma-flame/10 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {[
            {
              title: "Platform",
              links: ["Philosophy", "Library", "Notes", "Features"]
            },
            {
              title: "Resources",
              links: ["Frameworks", "Decision Guide"]
            },
            {
              title: "Company",
              links: ["About Us", "Privacy Policy", "Terms of Service", "Contact"]
            }
          ].map((column, idx) => (
            <motion.div variants={itemVariants} key={idx}>
              <h4 className="text-dharma-ivory font-medium mb-6 uppercase tracking-widest text-xs">{column.title}</h4>
              <ul className="space-y-4">
                {column.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <button 
                      onClick={() => handleLinkClick(link)} 
                      className="group inline-flex items-center gap-2 text-dharma-ivory-dim hover:text-dharma-ivory transition-colors text-sm text-left cursor-pointer"
                    >
                      {link}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Massive Footer Title */}
        <div className="relative pt-12 border-t border-dharma-line-dark overflow-hidden flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-[12vw] font-serif leading-none tracking-tighter text-dharma-ivory/5 select-none"
          >
            Noerax
          </motion.h1>
          
          <div className="absolute bottom-0 left-0 w-full flex flex-col md:flex-row items-center justify-between text-xs text-dharma-ivory-dim/50 pb-2">
            <p>&copy; {new Date().getFullYear()} Noerax Inc. All rights reserved.</p>
            <p className="flex items-center gap-1 mt-2 md:mt-0">
              Designed for the modern soul
            </p>
          </div>
        </div>

      </div>

      {/* Legal Modal (Privacy & Terms) */}
      <AnimatePresence>
        {legalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto"
            onClick={() => setLegalModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dharma-ink w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-dharma-line-dark relative my-8 max-h-[80vh] overflow-y-auto"
            >
              <button
                onClick={() => setLegalModal(null)}
                className="absolute top-5 right-5 p-2 text-dharma-ivory-dim hover:text-dharma-ivory hover:bg-dharma-ivory/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-6 h-6 text-dharma-flame" />
                <h2 className="text-2xl font-serif text-dharma-ivory">
                  {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                </h2>
              </div>

              {legalModal === 'privacy' ? (
                <div className="space-y-4 text-sm text-dharma-ivory-dim leading-relaxed">
                  <p>At <strong>Noerax</strong>, your privacy is deeply respected. We process your data to deliver spiritual guidance, AI analysis, and store your daily progress securely.</p>
                  <h4 className="text-dharma-ivory font-semibold text-base mt-4">1. Information We Collect</h4>
                  <p>We collect your name, email address, password hash, and journal entries. All password hashes are encrypted using <code>bcrypt</code> and tokens are secured via standard JWT protocols.</p>
                  <h4 className="text-dharma-ivory font-semibold text-base mt-4">2. AI Data Usage</h4>
                  <p>Your journal entries and scripture inquiries are processed via secure server-to-server API calls to Gemini AI. We do not sell your personal reflections to third-party advertisers.</p>
                  <h4 className="text-dharma-ivory font-semibold text-base mt-4">3. Your Rights</h4>
                  <p>You may request deletion of your account and stored reflections at any time through our support team.</p>
                </div>
              ) : (
                <div className="space-y-4 text-sm text-dharma-ivory-dim leading-relaxed">
                  <p>Welcome to <strong>Noerax</strong>. By accessing our platform, you agree to these Terms of Service.</p>
                  <h4 className="text-dharma-ivory font-semibold text-base mt-4">1. Spiritual Guidance Disclaimer</h4>
                  <p>Noerax provides philosophical insights and AI reflection tools. It is not a replacement for professional mental health counseling or medical advice.</p>
                  <h4 className="text-dharma-ivory font-semibold text-base mt-4">2. User Conduct</h4>
                  <p>You agree to use Noerax for lawful purposes and refrain from submitting harmful, malicious, or abusive content to our AI engines.</p>
                  <h4 className="text-dharma-ivory font-semibold text-base mt-4">3. Intellectual Property</h4>
                  <p>All design assets, artwork, and proprietary code belong to Noerax Inc. Ancient scripture text remains in the public domain.</p>
                </div>
              )}

              <button
                onClick={() => setLegalModal(null)}
                className="w-full py-3 bg-dharma-flame text-white font-semibold rounded-xl mt-8 hover:bg-dharma-saffron transition-colors"
              >
                I Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.footer>
  );
}
