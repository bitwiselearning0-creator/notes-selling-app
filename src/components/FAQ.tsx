import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'What is Bitwise Learning?',
    answer: 'Bitwise Learning is a premium educational platform offering hand-written study notes, syllabus discussions, previous year question (PYQ) solutions, and course playlists for BTech engineering students to help them excel in university exams.'
  },
  {
    question: 'How can I access the notes?',
    answer: 'Once you create an account, you can explore notes catalog by year and semester. Free notes can be accessed directly. Premium notes can be unlocked instantly using secure online payments (UPI, cards, wallets) and will be permanently available in your "My Library" dashboard.'
  },
  {
    question: 'Is my payment secure?',
    answer: 'Yes! We use Razorpay, one of India\'s largest payment gateways, which supports 100% secure payments via UPI, Google Pay, PhonePe, credit/debit cards, and netbanking. We do not store any card or banking credentials on our servers.'
  },
  {
    question: 'Can I read the notes offline?',
    answer: 'Absolutely! Our mobile application allows you to download and cache purchased notes locally inside the app. Once downloaded, you can study them without any internet connection. In the web version, notes are opened inside a secure viewer.'
  },
  {
    question: 'Are the notes updated according to the latest syllabus?',
    answer: 'Yes, all notes and PYQ solutions are checked and updated regularly by top educators to ensure alignment with the latest AKTU and university syllabus revisions.'
  }
];

export const FAQ: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-section">
      <div className="faq-list">
        {FAQ_DATA.map((item, index) => {
          const isOpen = activeIndex === index;
          return (
            <div key={index} className={`faq-card ${isOpen ? 'active' : ''}`}>
              <button 
                className="faq-question-btn" 
                onClick={() => toggleAccordion(index)}
                aria-expanded={isOpen}
              >
                <span className="faq-question-text">{item.question}</span>
                <span className="faq-icon-wrapper">
                  {isOpen ? <Minus size={18} className="yellow-accent" /> : <Plus size={18} />}
                </span>
              </button>
              
              <div className={`faq-answer-container ${isOpen ? 'show' : ''}`}>
                <div className="faq-answer-content">
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
