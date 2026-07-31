import { useState } from 'react';

const footerDetails: Record<string, string> = {
  'Contact Us': 'Reach out anytime for support, feedback, or help with your diary experience.',
  'Our Services': 'Explore journal tools, private entries, sticker customization, and a calm personal space.',
  'FAQs': 'Need help getting started? You can create entries, save drafts, and customize your settings in seconds.',
  'Privacy Policy': 'Your journals are treated with care, and your personal data remains protected with privacy-first design.',
  'Cookie Policy': 'We use essential cookies to keep the app functional and improve your experience while you browse.',
  'Website Terms of Use': 'By using Dear Diary, you agree to keep the experience respectful, secure, and personal to each user.',
  'Code of Conduct': 'We encourage thoughtful, kind, and safe interactions for everyone using the platform.',
  'About Us': 'Dear Diary was created to help people capture memories, emotions, and reflections in a peaceful space.',
};

function Footer() {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  return (
    <>
      <div
        style={{ background: 'linear-gradient(90deg, #0a1020, #172645)', color: 'var(--text)', borderTop: '1px solid var(--border)' }}
        className="mt-12"
      >
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Client Services */}
            <div>
              <h3 className="text-sm font-bold tracking-widest mb-4" style={{ color: 'var(--text-h)' }}>
                CLIENT SERVICES
              </h3>

              <ul className="space-y-2" style={{ color: 'var(--text-muted)' }}>
                {['Contact Us', 'Our Services', 'FAQs'].map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => setActiveItem(item)}
                      className="text-left hover:text-white transition"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Privacy */}
            <div>
              <h3 className="text-sm font-bold tracking-widest mb-4" style={{ color: 'var(--text-h)' }}>
                LEGAL & PRIVACY
              </h3>

              <ul className="space-y-2" style={{ color: 'var(--text-muted)' }}>
                {['Privacy Policy', 'Cookie Policy', 'Website Terms of Use', 'Code of Conduct'].map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => setActiveItem(item)}
                      className="text-left hover:text-white transition"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Corporate */}
            <div>
              <h3 className="text-sm font-bold tracking-widest mb-4" style={{ color: 'var(--text-h)' }}>
                CORPORATE
              </h3>

              <ul className="space-y-2" style={{ color: 'var(--text-muted)' }}>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveItem('About Us')}
                    className="text-left hover:text-white transition"
                  >
                    About Us
                  </button>
                </li>
              </ul>

              {/* Social Media */}
              <div className="flex gap-4 mt-6">
                <a href="#">
                  <img
                    src="/src/assets/facebook.png"
                    alt="Facebook"
                    className="w-6 h-6 invert hover:scale-110 transition"
                  />
                </a>

                <a href="#">
                  <img
                    src="/src/assets/instagram.png"
                    alt="Instagram"
                    className="w-6 h-6 invert hover:scale-110 transition"
                  />
                </a>

                <a href="#">
                  <img
                    src="/src/assets/youtube.png"
                    alt="YouTube"
                    className="w-6 h-6 invert hover:scale-110 transition"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-700" />

        <div className="text-center text-xs py-4 px-4" style={{ color: 'var(--text-muted)' }}>
          © 2026 Dear Diary — All Rights Reserved. Your Personal Digital Journal.
        </div>
      </div>

      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{activeItem}</h3>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="rounded-full border border-white/20 px-3 py-1 text-sm text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
            <p className="text-sm leading-7 text-slate-300">{footerDetails[activeItem]}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default Footer;