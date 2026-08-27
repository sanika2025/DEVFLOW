import { motion } from 'framer-motion';

export function Card({ children, className = '', noPadding = false, ...props }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      className={`glass dark:glass-dark rounded-2xl overflow-hidden transition-colors ${noPadding ? '' : 'p-6'} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
